"use strict";

// Step objects represent a particular set of pushes, eg fixes, merge changesets etc.
// They encapsulate what bugs are "attached" to a particular changeset - i.e. which
// bugs should be commented with the url for a particular push, along with the comment to
// be written for each push/bug combination. A step is also responsible for transmitting the
// relevant changes to Bugzilla
function Step(name, callbacks, isBackout) {

  var self = this;

  function constructAttachedBugs(useBackouts) {
    var arr = PushData[self.name];
    if (useBackouts)
      arr = PushData['backedOut'];

    var len = arr.length;
    for (var i = 0; i < len; i++) {
      var push = PushData.allPushes[arr[i]];
      if (push.bug) {
        self.attachedBugs[arr[i]] = {};
        self.attachBugToCset(arr[i], push.bug);
      } else if (push.backoutBugs && push.backoutBugs.length > 0) {
        self.attachedBugs[arr[i]] = {};
        var l2 = push.backoutBugs.length;
        for (var j = 0; j < l2; j++)
          self.attachBugToCset(arr[i], push.backoutBugs[j]);
      }
    }
  }

  this.name = name;
  this.callbacks = callbacks;
  this.hasBackouts = isBackout;

  this.attachedBugs = {};
  this.bugInfo = {};
  this.sent = [];
  this.prependChosen = false;
  this.prependText = '';

  // The following are used for additional help text
  this.leaveOpenBugs = [];
  this.multiBugs = [];
  this.securityBugs = [];
  this.hasMilestones = [];
  this.statusChangeBugs = [];
  this.haveComment = [];

  var options = {};
  if (Step.remaps.items > 0)
    options.test = true;
  this.unprivilegedLoader = bz.createClient(options);

  constructAttachedBugs(false);
  if (this.hasBackouts)
    constructAttachedBugs(true);
}


Step.prototype.getName = function Step_getName() {
  return this.name;
};


Step.prototype.canSubmit = function Step_canSubmit() {
  for (var bug in this.bugInfo) {
    var info = this.bugInfo[bug];
    if ((info.canResolve && info.shouldResolve))
      return true;
  }

  for (var cset in this.attachedBugs) {
    for (var b in this.attachedBugs[cset]) {
      var attached = this.attachedBugs[cset][b];
      if (attached.canComment && attached.shouldComment)
        return true;
    }
  }
  return false;
};


Step.prototype.getSentData = function Step_getSentData() {
  return this.sent;
};


Step.prototype.hasSecurityBugs = function Step_hasSecurityBugs() {
  return this.securityBugs.length > 0;
};


Step.prototype.getSecurityBugs = function Step_getSecurityBugs() {
  var secBugs = [];
  for (var cset in this.attachedBugs) {
    for (var b in this.attachedBugs[cset]) {
      if (!(b in BugData.bugs))
        secBugs.push({bug: b, cset: PushData.allPushes[cset].cset, link: PushData.allPushes[cset].hgLink});
    }
  }
  return secBugs;
};


Step.prototype.createComment = function Step_createComment(text) {
  return {creation_time: new Date().toISOString(),
          creator: {email: Step.username},
          is_private: 0,
          text: text};
};


Step.prototype.createBug = function Step_createBug(bugID, info) {
  var bug = {};
  var changed = false;

  if (info.canResolve && info.shouldResolve) {
    bug.resolution = 'FIXED';
    bug.status = 'RESOLVED';
    changed = true;
    if (info.milestone != '---' && info.milestone != BugData.bugs[bugID].milestone) {
      bug.target_milestone = info.milestone;
      bug.product = BugData.bugs[bugID].product;
    }
  } else if (info.canReopen && info.shouldReopen) {
    bug.resolution = '';
    bug.status = 'REOPENED';
    changed = true;
  }

  var comments = [];
  for (var i = 0; i < info.linkedChangesets.length; i++) {
    var index = info.linkedChangesets[i];
    var attached = this.attachedBugs[index][bugID];
    if (!attached.canComment || !attached.shouldComment)
      continue;
    comments.push(attached.comment);
  }

  if (comments.length > 0) {
    var text = comments.join('\n');
    bug.comments = [this.createComment(text)];
    changed = true;
  }

  if (changed) {
    bug.id = bugID;

    bug.whiteboard = BugData.bugs[bugID].whiteboard;

    // Remove checkin-needed if present in keywords
    var keywords = BugData.bugs[bugID].keywords;
    var checkinIndex = keywords.indexOf('checkin-needed');
    if (checkinIndex != -1) {
      keywords.splice(checkinIndex, 1);
      bug.keywords = keywords;
    }

    // Set status flag if appropriate
    if (info.canSetStatus && info.shouldSetStatus) {
      var fieldName = 'cf_' + bugherder.statusFlag;
      bug[fieldName] = 'fixed';
    }

    // Set assignee if appropriate
    if (!BugData.bugs[bugID].leaveOpen && !info.canReopen && !info.shouldReopen &&
        BugData.bugs[bugID].isUnassigned && info.linkedChangesets.length > 0) {
      var canSetAssignee = true;
      var assignee = PushData.allPushes[info.linkedChangesets[0]].email;
      for (var i = 1; i < info.linkedChangesets.length; i++) {
        if (PushData.allPushes[info.linkedChangesets[i]].email != assignee) {
          canSetAssignee = false;
          break;
        }
      }
      if (canSetAssignee)
        bug.assigned_to = {name: assignee};
    }

    // Set in-testsuite if possible 
    if (BugData.bugs[bugID] && info.canSetTestsuite && info.intestsuite != BugData.bugs[bugID].intestsuite) {
      bug.flags = [{name: 'in-testsuite',
                    setter: {email: Step.username},
                    type_id: ConfigurationData.testsuiteFlagID,
                    status: info.intestsuite}];
      if (BugData.bugs[bugID].testsuiteFlagID != -1)
        bug.flags[0].id = BugData.bugs[bugID].testsuiteFlagID;
    }

    if (bugID in Step.remaps) {
      bug.id = Step.remaps[bugID];
      if ('resolution' in bug)
        bug.product = 'mcMerge test product';
    }
    return bug;
  }

  return null;
};


Step.prototype.constructData = function Step_constructData() {
  this.sendData = [];
  for (var bug in this.bugInfo) {
    if (Step.remaps.items == 0 || bug in Step.remaps) {
      var info = this.bugInfo[bug];
      var data = this.createBug(bug, info);

      if (data)
        this.sendData.push(data);
    }
  }
};


Step.prototype.onSubmitError = function Step_onSubmitError(where, msg, i) {
  if (where == 'lct' && (msg == 'HTTP status 400' || msg == 'HTTP status 401') ) {
    // There are a number of possibilities here:
    // - an invalid username or password was supplied
    // - the bug we were trying to load is a security bug (shouldn't happen, unless someone
    //    changed the bug underneath us after the initial bug data load)
    // - a tester remapped to a non-existant bug on landfill, (they should know better :))
    // If we've failed trying to get the time/token on our very first bug, let's just put it
    //   down to username/password, and abandon this submit attempt
    // If we failed in the i-1th bug too, again abandon all hope. (Did you change your password while bugherder was working?!?)
    // Else, we'll note this one failed and try the next. If we carry on without further failure, then this was a
    //  security bug that wasn't one before
    if (i == 0 || this.retries[this.retries.length-1] == i - 1) {
      // XXX What if we've already succesfully submitted some?
      delete Step.privilegedLoad;
      delete Step.privilegedUpdate;
      delete Step.username;
      this.retries = [];
      UI.showErrorMessage('The username or password you supplied was not valid. Submit attempt abandoned.');
      UI.hideProgressModal();
      return;
    }
    this.retries.push(i);
    this.continueSubmit(i);
  }
  if (where == 'submit' && (msg == 'HTTP status 400' || msg == 'HTTP status 401') ) {
    // First check to see if there was an assignee in the data we sent. If so, we should try and submitting again - it may have been a
    // case where the email was wrong (or the author's bugzilla email is different from the email in the changeset). Don't count that as
    // a retry
    if ('assigned_to' in this.sendData[i]) {
      delete this.sendData[i].assigned_to;
      this.startSubmit(i);
      return;
    }
  }
  // If we got a bad request here, either we were mid-aired or something really
  // odd happened, like the product milestone was deleted. Try again, unless of course this *was* our
  // retry
  if (this.retries.length == 0 || this.retries[this.retries.length - 1] != i) {
    this.retries.push(i);
    this.startSubmit(i);
    return;
  }
  this.continueSubmit(i);
};


Step.prototype.onSubmit = function Step_onSubmit() {
  UI.hide('errors');
  if ((typeof Step.privilegedUpdate == 'undefined') || (typeof Step.username == 'undefined') ||
      (typeof Step.privilegedLoad == 'undefined'))
    this.callbacks.credentialsCallback();
  else
    this.beginSubmit();
};


Step.prototype.onCredentialsAcquired = function Step_onCredentialsAcquired(username) {
  this.beginSubmit();
};


Step.prototype.beginSubmit = function Step_beginSubmit() {
  UI.showProgressModal();
  this.constructData();
  this.retries = [];
  this.successful = 0;
  this.prependChosen = false;
  this.prependText = '';
  if (this.sendData.length == 0) {
    UI.hideProgressModal();
    return;
  }

  this.startSubmit(0);
};


Step.prototype.startSubmit = function Step_startSubmit(i) {
  var self = this;

  // Offer the chance to add a backout explanation where appropriate
  if (this.name == 'notFoundBackouts' && 'comments' in this.sendData[i] &&
      this.sendData[i].comments[0].text.indexOf(Config.hgBaseURL) == 0) {
    if (this.prependChosen) {
      this.sendData[i].comments[0].text = this.prependText + this.sendData[i].comments[0].text
      this.midSubmit(i);
    } else {
      var self = this;
      var callback = function Step_onExplanationAcquired(text, useForAll) {
        if (useForAll) {
          self.prependChosen = true;
          self.prependText = text;
        }
        self.sendData[i].comments[0].text = text + self.sendData[i].comments[0].text
        self.midSubmit(i);
      };
      UI.acquireExplanation(callback, this.sendData[i].id);
    }
  } else
    this.midSubmit(i);
};


Step.prototype.midSubmit = function Step_midSubmit(i) {
  var self = this;
  var callback = function Step_startSubmitCallback(lct, ut) {
    self.sendData[i].last_change_time = lct;
    self.sendData[i].update_token = ut;
    self.submit(i);
  };
  this.getLastChangeAndToken(i, callback);
};


Step.prototype.getLastChangeAndToken = function Step_getLastChangeAndToken(i, callback) {
  var self = this;
  var id = this.sendData[i].id;
  var ourCallback  = function Step_getLCATCallback(errmsg, data) {
    if (errmsg)
      self.onSubmitError('lct', errmsg, i, callback);
    else
      callback(data.last_change_time, data.update_token);
  };

  Step.privilegedLoad(id, ourCallback);
};


Step.prototype.submit = function Step_submit(i) {
  // we start with an utterly unsophisticated hack for debugging/testing
  if (Step.remaps.items > 0 && Step.remaps.midair)
    alert('MID-AIR TIME!');

  var self = this;
  var callback = function Step_submitCallback(errmsg, data) {
    if (errmsg)
      self.onSubmitError('submit', errmsg, i, callback);
    else
      self.postSubmit(i);
  };

  Step.privilegedUpdate(this.sendData[i].id, this.sendData[i], callback);
};


Step.prototype.postSubmit = function Step_postSubmit(i) {
  // If this was a retry, remove it from the retries array - we succeeded!
  if (this.retries.length > 0 && this.retries[this.retries.length - 1] == i)
    this.retries.pop();

  this.successful += 1;
  UI.updateProgressModal(((i+1) * 100)/this.sendData.length);

  var sent = this.sendData[i];
  delete sent.update_token;
  this.sent.push(sent);
  var bugID = sent.id;

  // If we were in remapping mode, we need to reverse the mapping!
  for (var k in Step.remaps) {
    if (k == 'items')
      continue;
    if (Step.remaps[k] == bugID) {
      bugID = k;
      break;
    }
  }

  var info = this.bugInfo[bugID];

  // Disallow resolving if we just resolved the bug
  if ('resolution' in sent) {
    BugData.bugs[bugID].status = sent.status;
    BugData.bugs[bugID].resolution = sent.resolution;
    if ('target_milestone' in sent)
      BugData.bugs[bugID].milestone = sent.target_milestone;
    info.canResolve = false;
    info.shouldResolve = false;
    BugData.bugs[bugID].canReopen = false;
    info.canReopen = false;
  }


  // Update the intestsuite flag if we sent it
  if ('flags' in sent) {
    info.intestsuite = sent.flags[0].status;
    BugData.bugs[bugID].intestsuite = sent.flags[0].status;
  }

  for (var j = 0; j < info.linkedChangesets.length; j++) {
    var index = info.linkedChangesets[j];
    // Disallow comments if we just sent a comment
    if ('comments' in sent) {
      var attached = this.attachedBugs[index][bugID];
      if (attached.canComment && attached.shouldComment) {
        attached.canComment = false;
        attached.shouldComment = false;
      }
    }
    this.callbacks.uiUpdate(index, bugID);
  }

  // Disallow setting status- if we just sent it
  if ('cf_' + bugherder.statusFlag in sent) {
    info.canSetStatus = false;
    info.shouldSetStatus = false;
    BugData.bugs[bugID].statusFlag = sent['cf_' + bugherder.statusFlag];
  }

  this.continueSubmit(i);
};


Step.prototype.continueSubmit = function Step_continueSubmit(i) {
  if (i + 1 >= this.sendData.length) {
    UI.updateProgressModal(100);
    if (this.retries.length > 0) {
      var ltext = this.retries.map(function(elem) {
        var bug = this.sendData[elem].id;
        return 'Bug ' + bug;}, this).join('\n');
      UI.showErrorMessage('The following bugs failed to submit:\n' + ltext);
    }
    window.setTimeout(UI.hideProgressModal, 1000);
  } else
    this.startSubmit(i+1);
};


Step.prototype.adjustWhiteboard = function Step_adjustWhiteboard(whiteboard, backingOut) {
  var newWhiteboard = whiteboard;

  if (Config.treeName == 'mozilla-central' || backingOut) {
    // It appears some people still do this, so we may as well correct it
    newWhiteboard = whiteboard.replace('[inbound]','');

    // Remove annotations on fx-team merges
    newWhiteboard = newWhiteboard.replace(/\[fixed(?:\s+|-)in(?:\s+|-)fx(?:\s+|-)team\]/ig, '');

    // Remove annotations on s-c merges
    newWhiteboard = newWhiteboard.replace(/\[fixed(?:\s+|-)in(?:\s+|-)services\]/ig, '');
  }

  if ('additions' in Config.treeInfo[Config.treeName]) {
    var addition = Config.treeInfo[Config.treeName].additions;
    if (newWhiteboard.indexOf(addition) == -1)
      newWhiteboard = newWhiteboard + addition;
  }

  return newWhiteboard;
};


// Update the shouldSetStatus field for a bug
Step.prototype.checkShouldSetStatus = function Step_checkShouldSetStatus(bugID) {
  if (!(bugID in this.bugInfo))
    return

  var info = this.bugInfo[bugID];
  if (!info.canSetStatus) {
    info.shouldSetStatus = false; 
    return;
  }

  // Basically we want some kind of assertion of the fix to be posted to the bug
  // That means - for a tracked tree - we should be sending at least one comment.
  // Additionally, for m-c and c-c we also need to be resolving the bug.
  if ((Config.treeName == 'mozilla-central' || Config.treeName == 'comm-central')  &&
      (!info.canResolve || !info.shouldResolve)) {
    info.shouldSetStatus = false;
    return;
  }

  var linked = info.linkedChangesets;
  var hasComment = false;
  for (var i = 0; i < info.linkedChangesets.length; i++) {
    var index = info.linkedChangesets[i];
    var attached = this.attachedBugs[index][bugID];
    if (attached.canComment && attached.shouldComment) {
      hasComment = true;
      break;
    }
  }

  info.shouldSetStatus = hasComment;
};


// Associate a bug number with a particular push
Step.prototype.attachBugToCset = function Step_attachBugToCset(index, bugID) {
  var attached = {};
  var isMC = Config.treeName == 'mozilla-central';

  attached.comment = PushData.allPushes[index].hgLink;

  if (bugID in BugData.bugs) {
    attached.shouldComment = !(PushData.allPushes[index].backedOut);
  } else {
    attached.shouldComment = false;
  }

  var leaveOpen = false;
  var milestone = '---';
  var hasMilestone = false;
  var bug = BugData.bugs[bugID];

  if (bug) {
    leaveOpen = bug.leaveOpen;
    hasMilestone = bug.milestone != '---';
    if (hasMilestone || leaveOpen || !(Config.treeName == 'mozilla-central' || Config.treeName == 'comm-central'))
      milestone = bug.milestone;
    else {
      var defaultMilestone = ConfigurationData.milestones[bug.product].defaultIndex;
      milestone = ConfigurationData.milestones[bug.product].values[defaultMilestone];
    }
  }

  if (!(bugID in this.bugInfo)) {
    this.bugInfo[bugID] = {canResolve: bug && bug.canResolve,
                           shouldResolve: bug && !(PushData.allPushes[index].backedOut) &&
                                          bug.canResolve && !leaveOpen,
                           linkedChangesets: [],
                           canReopen: false,
                           shouldReopen: false,
                           canSetStatus: false,
                           shouldSetStatus: false,
                           canSetTestsuite: bug && bug.canSetTestsuite,
                           milestone: milestone};

    // Don't resolve bugs for integration repos
    if (Config.treeName != 'mozilla-central' && Config.treeName != 'comm-central') {
      this.bugInfo[bugID].canResolve = false;
      this.bugInfo[bugID].shouldResolve = false;
       
    }

    // Handle backouts when safe to do so
    if (PushData.safeToReopen() && bug && bug.canReopen) {
      this.bugInfo[bugID].canReopen = true;
      this.bugInfo[bugID].shouldReopen = true;
      attached.shouldComment = true;
    }

    // Release-tracking: determine if status-[tree]N can be set
    if (bug && (bug.statusFlag == '---' || bug.statusFlag == 'affected' || bug.statusFlag == '?')) {
      if ((bug.isTracked || bug.statusFlag == "affected") && (isMC || Config.treeName == 'comm-central'))
        this.bugInfo[bugID].canSetStatus = this.bugInfo[bugID].canResolve;
      else if (Config.treeInfo[Config.treeName].trackedTree)
        this.bugInfo[bugID].canSetStatus = true;
    } else if (bug && Config.treeInfo[Config.treeName].trackedTree && Config.treeInfo[Config.treeName].unconditionalFlag) {
        bug.isTracked = true;
        this.bugInfo[bugID].canSetStatus = true;
    }

    // Allow setting of intestsuite if possible
    if (bug && bug.canSetTestsuite)
      this.bugInfo[bugID].intestsuite = bug.intestsuite;

    // Adjust the whiteboard the first time we see this bug
    if (bug)
      bug.whiteboard = this.adjustWhiteboard(bug.whiteboard, this.bugInfo[bugID].canReopen);
  }

  if (bug && bug.comments) {
    var hasThisComment = false;
    // Iterate backwards: if commented already, the changeset will be in one of the last comments
    for (var i = bug.comments.length - 1; i > -1; i--) {
      if (bug.comments[i].text && bug.comments[i].text.indexOf(attached.comment) != -1) {
        hasThisComment = true;
        if (this.haveComment.indexOf(bug.id) == -1)
          this.haveComment.push(bug.id);
        break;
      }
    }
    attached.canComment = !hasThisComment;
  } else if (bug && bug.comments === undefined)
    attached.canComment = true;
  else 
    attached.canComment = false;

  if (!attached.canComment)
    attached.shouldComment = false;

  // Maintain indices of changesets linked to a particular bug, in order to coalesce comments
  this.bugInfo[bugID].linkedChangesets.push(index);
  this.bugInfo[bugID].linkedChangesets.sort(function compare(a, b) {return a-b;});

  if (!(index in this.attachedBugs))
    this.attachedBugs[index] = {};

  var attachedBugs = this.attachedBugs[index];
  attachedBugs[bugID] = attached;

  // Release-tracking: determine if status-[tree]N should be set
  if (bug)
    this.checkShouldSetStatus(bugID);

  // Various bits of state used for constructing additional help text
  if (this.bugInfo[bugID].linkedChangesets.length == 2)
    this.multiBugs.push(bugID);
  if (this.bugInfo[bugID].canSetStatus && this.bugInfo[bugID].shouldSetStatus &&
      this.statusChangeBugs.indexOf(bugID) == -1)
    this.statusChangeBugs.push(bugID);
  if (!bug && this.securityBugs.indexOf(bugID) == -1)
    this.securityBugs.push(bugID);
  if (isMC && leaveOpen && this.leaveOpenBugs.indexOf(bugID) == -1)
    this.leaveOpenBugs.push(bugID);
  if (isMC && hasMilestone && this.hasMilestones.indexOf(bugID) == -1 &&
      this.bugInfo[bugID].canResolve)
    this.hasMilestones.push(bugID);
};


// Returns an array of strings representing the bug numbers
// associated with the given push
Step.prototype.getAttachedBugs = function Step_getAttachedBugs(index) {
  var result = []

  if (index in this.attachedBugs) {
    for (var bugID in this.attachedBugs[index])
      result.push(bugID);
  }

  return result;
};


// Returns true if the given string bugID representing a bug number
// is associated with the push at the given index
Step.prototype.isAttached = function Step_isAttached(index, bugID) {
  if (!(index in this.attachedBugs))
    return false;
  if (!(bugID in this.attachedBugs[index]))
    return false;

  return true;
};


Step.prototype.updateShouldSetStatusAfterResolve = function Step_updateShouldSetStatusAfterResolve(bugID, should) {
  function removeFromArr(arr) {
    var i = arr.indexOf(bugID);
    if (i == -1)
      return;

    arr.splice(i, 1);
  }

  if (!this.bugInfo[bugID].canSetStatus)
    return;

  // Resolve can't be toggled for aurora/beta etc trees, so if we're here after a resolve toggle
  // that implies m-c/c-c. Hence, if shouldResolve has been switched off, we can immediately decide
  // that we can't set the status
  if (!should) {
    this.bugInfo[bugID].shouldSetStatus = false;
    removeFromArr(this.statusChangeBugs);
    return;
  }

  this.checkShouldSetStatus(bugID);
  if (this.bugInfo[bugID].shouldSetStatus && this.statusChangeBugs.indexOf(bugID) == -1)
    this.statusChangeBugs.push(bugID);
  else if (!this.bugInfo[bugID].shouldSetStatus)
    removeFromArr(this.statusChangeBugs);
};


Step.prototype.setShouldResolve = function Step_setShouldResolve(bugID, should) {
  if (!(bugID in this.bugInfo))
    return;

  this.bugInfo[bugID].shouldResolve = should;
  this.updateShouldSetStatusAfterResolve(bugID, should);
};


Step.prototype.toggleShouldResolve = function Step_toggleShouldResolve(bugID) {
  if (!(bugID in this.bugInfo))
    return;

  should = this.bugInfo[bugID].shouldResolve;
  this.bugInfo[bugID].shouldResolve = !should;
  this.updateShouldSetStatusAfterResolve(bugID, !should);
};


Step.prototype.shouldResolve = function Step_shouldResolve(bugID) {
  if (!(bugID in this.bugInfo))
    return false;

  return this.bugInfo[bugID].shouldResolve;
};


Step.prototype.canResolve = function Step_canResolve(bugID) {
  if (!(bugID in this.bugInfo))
    return false;

  return this.bugInfo[bugID].canResolve;
};


Step.prototype.shouldReopen = function Step_shouldReopen(bugID) {
  if (!(bugID in this.bugInfo))
    return false;

  return this.bugInfo[bugID].shouldReopen;
};


Step.prototype.canReopen = function Step_canReopen(bugID) {
  if (!(bugID in this.bugInfo))
    return false;

  return this.bugInfo[bugID].canReopen;
};


Step.prototype.setShouldReopen = function Step_setShouldReopen(bugID, should) {
  if (!(bugID in this.bugInfo))
    return;

  this.bugInfo[bugID].shouldReopen = should;
};


Step.prototype.canSetMilestone = function Step_canSetMilestone(bugID) {
  if (!(bugID in this.bugInfo))
    return false;

  return this.bugInfo[bugID].canResolve && bugID in BugData.bugs;
};


Step.prototype.getMilestone = function Step_getMilestone(bugID) {
  if (!(bugID in this.bugInfo))
    return '---';

  return this.bugInfo[bugID].milestone;
};


Step.prototype.setMilestone = function Step_setMilestone(bugID, newVal) {
  if (!(bugID in this.bugInfo))
    return;

  this.bugInfo[bugID].milestone = newVal;
};


Step.prototype.getTestsuite = function Step_getTestsuite(bugID) {
  if (!(bugID in this.bugInfo))
    return ' ';

  return this.bugInfo[bugID].intestsuite;
};


Step.prototype.setTestsuite = function Step_setTestsuite(bugID, newVal) {
  if (!(bugID in this.bugInfo))
    return;

  this.bugInfo[bugID].intestsuite = newVal;
};


Step.prototype.updateShouldSetStatusAfterComment = function Step_updateShouldSetStatusAfterComment(bugID) {
  function removeFromArr(arr) {
    var i = arr.indexOf(bugID);
    if (i == -1)
      return;

    arr.splice(i, 1);
  }

  if (!this.bugInfo[bugID].canSetStatus)
    return;

  this.checkShouldSetStatus(bugID);
  if (this.bugInfo[bugID].shouldSetStatus && this.statusChangeBugs.indexOf(bugID) == -1)
    this.statusChangeBugs.push(bugID);
  else if (!this.bugInfo[bugID].shouldSetStatus)
    removeFromArr(this.statusChangeBugs);
};


Step.prototype.setShouldComment = function Step_setShouldComment(index, bugID, should) {
  if (!this.isAttached(index, bugID))
    return;

  this.attachedBugs[index][bugID].shouldComment = should;
  this.updateShouldSetStatusAfterComment(bugID);
};


Step.prototype.shouldComment = function Step_shouldComment(index, bugID) {
  if (!this.isAttached(index, bugID))
    return false;

  return this.attachedBugs[index][bugID].shouldComment;
};


Step.prototype.toggleShouldComment = function Step_toggleShouldComment(index, bugID) {
  if (!this.isAttached(index, bugID))
    return;

  should = this.attachedBugs[index][bugID].shouldComment;
  this.attachedBugs[index][bugID].shouldComment = !should;
  this.updateShouldSetStatusAfterComment(bugID);
};


Step.prototype.setComment = function Step_setComment(index, bugID, comment) {
  if (!this.isAttached(index, bugID))
    return;

  this.attachedBugs[index][bugID].comment = comment;
};


Step.prototype.getComment = function Step_getComment(index, bugID) {
  if (!this.isAttached(index, bugID))
    return '';

  return this.attachedBugs[index][bugID].comment;
};


Step.prototype.canComment = function Step_canComment(index, bugID) {
  if (!this.isAttached(index, bugID))
    return false;

  return this.attachedBugs[index][bugID].canComment;
};


Step.prototype.setWhiteboard = function Step_setWhiteboard(index, bugID, whiteboard) {
  if (!this.isAttached(index, bugID))
    return;

  if (bugID in BugData.bugs)
    BugData.bugs[bugID].whiteboard = whiteboard;
};


Step.prototype.getProp = function Step_getProp(index, bugID, prop) {
  if (prop == 'shouldResolve')
    return this.shouldResolve(bugID);
  if (prop == 'canResolve')
    return this.canResolve(bugID);
  if (prop == 'shouldComment')
    return this.shouldComment(index, bugID);
  if (prop == 'canComment')
    return this.canComment(index, bugID);
  if (prop == 'shouldReopen')
    return this.shouldReopen(bugID);
  if (prop == 'canReopen')
    return this.canReopen(bugID);

  return false;
};


// Disassociate a bug with the changeset at the given index
Step.prototype.detachBugFromCset = function Step_detachBugFromCset(index, bugID) {
  if (!this.isAttached(index, bugID))
    return;

  delete this.attachedBugs[index][bugID]
  this.bugInfo[bugID].linkedChangesets.splice(this.bugInfo[bugID].linkedChangesets.indexOf(index),1)

  function removeFromArr(arr) {
    var i = arr.indexOf(bugID);
    if (i == -1)
      return;

    arr.splice(i, 1);
  }

  if (this.bugInfo[bugID].linkedChangesets.length == 0) {
    removeFromArr(this.securityBugs);
    removeFromArr(this.leaveOpenBugs);
    removeFromArr(this.statusChangeBugs);
    delete this.bugInfo[bugID];
  } else if (this.bugInfo[bugID].linkedChangesets.length == 1)
    removeFromArr(this.multiBugs);
};


// Convenience function for constructing correctly pluralised text
// for the help text, based on the contents of the given array
Step.prototype.constructTextFor = function Step_constructTextFor(arr, postText, verb, expandAll) {
  var isare = {singular: 'is', plural: 'are'};
  verb = verb || isare;
  expandAll = expandAll || false;
  var text = '';

  if (arr.length > 0) {
    var len = arr.length;
    text += '<br>- ';
    if (len <= 3 || expandAll) {
      if (len == 1)
        text += 'Bug ' + UI.linkifyBug(arr[0]);
      else  {
        text += 'Bugs ';
        for (var i = 0; i < len - 1; i++) {
          if (i != 0)
            text += ',';
          text += ' ' + UI.linkifyBug(arr[i]);
        }
        text += ' and ' + UI.linkifyBug(arr[len - 1]);
      }
    } else
      text += 'Several bugs';
    if (len == 1)
      text += ' ' + verb.singular;
    else
      text += ' ' + verb.plural;
    text += postText;
  }

  return text;
};


// Calls out various interesting properties of the attached bugs
//   - "multi" bugs (where a bug is associated with multiple changesets
//   - "leave open" bugs (where the assignee doesn't want the bug resolved
//   - "security" bugs (bugs bugherder couldn't access)
//   - "has milestone" bugs (bugs that can be resolved, but already had a milestone)
Step.prototype.getAdditionalHelpText = function Step_getAdditionalHelpText() {
  var text = '';

  var multiPost = ' associated with multiple changesets: the individual comments will be coalesced into a single comment.';
  var leaveOpenPost = ' "leave open" in the whiteboard, so the resolve flag has not been set.';
  var securityPost = ' restricted - bugherder was unable to load the relevant information from Bugzilla.';
  var milestonePost = ' a milestone set. You may wish to check it is correct before submitting.';
  var alreadyCommentPost = ' to have already been commented with the correct changeset URL, so commenting there has been disabled.';
  var statusChangePost = ' tracked or uplifted and will have ' + bugherder.statusFlag + ' set to "fixed".';

  var hashave = {singular: 'has', plural: 'have'};
  var appearTo = {singular: 'appears', plural: 'appear'};
  var isare = {singular: 'is', plural: 'are'};
  var already = {singular: 'already has', plural: 'already have'};

  if (this.multiBugs.length > 0 || this.leaveOpenBugs.length > 0 ||
      this.securityBugs.length > 0)
    text += '<br>';

  if (this.multiBugs.length > 0)
    text += this.constructTextFor(this.multiBugs, multiPost);

  if (this.leaveOpenBugs.length > 0)
    text += this.constructTextFor(this.leaveOpenBugs, leaveOpenPost, hashave);

  if (this.securityBugs.length > 0)
    text += this.constructTextFor(this.securityBugs, securityPost);

  if (this.haveComment.length > 0)
    text += this.constructTextFor(this.haveComment, alreadyCommentPost, appearTo, true);

  if (this.hasMilestones.length > 0)
    text += this.constructTextFor(this.hasMilestones, milestonePost, already, true);

  if (this.statusChangeBugs.length > 0 && !Config.treeInfo[Config.treeName].unconditionalFlag)
    text += this.constructTextFor(this.statusChangeBugs, statusChangePost, isare);

  return text;
};


Step.prototype.setStepNumber = function Step_setStepNumber(num) {
  this.stepNumber = num;
};


Step.prototype.setMaxStepNumber = function Step_setMaxStepNumber(num) {
  this.maxStepNumber = num;
};


// Return the user-visible step name to be shown for this step
Step.prototype.getHeading = function Step_getHeading(addMax) {
  addMax = addMax || true;

  var res = this.name;
  if (this.name in Step.headings)
    res = Step.headings[this.name];

  if ('stepNumber' in this) {
    if (addMax && 'maxStepNumber' in this)
      res = 'Step ' + this.stepNumber + ' of ' + this.maxStepNumber + ': ' + res;
    else
      res = 'Step ' + this.stepNumber + ': ' + res;
  }

  return res;
};


// Return the user-visible help text to be shown for this step
Step.prototype.getHelpText = function Step_getHelpText() {
  var helpText = '';
  if (this.name in Step.helpTexts)
    helpText = Step.helpTexts[this.name];
  helpText += this.getAdditionalHelpText();

  if (this.statusChangeBugs.length > 0 && Config.treeInfo[Config.treeName].unconditionalFlag)
    helpText += '<br>- Submitted bugs will have ' + bugherder.statusFlag + ' set to "fixed"';

  if (Step.remaps && 'items' in Step.remaps && Step.remaps.items > 0)
    helpText += '<br><strong>Note: You are in debug mode. Only remap bugs will be submitted, and will be submitted to landfill.bugzilla.org!</strong>';
  return helpText;
};


Step.helpTexts=  {
    fixes: 'The following fixes have landed. Double-check that the bug number has been correctly detected, and the correct comment attached, and that the "Comment" and "Resolve" flags have been correctly set. Click on "Submit" to submit these changes to Bugzilla.',
    foundBackouts: 'The following pushes appear to have been backed-out, and therefore shouldn\'t require commenting or resolving. However, the backout may require commenting - click on "Add bugs" if so.',
    notFoundBackouts: 'The following changesets have been detected as backouts, but the changesets or bugs backed out do not appear to be within this merge. Review this information, and manually comment in Bugzilla as necessary.',
    merges: 'The following changesets have been detected to be merge changesets, not tied to any particular bug. Review these changesets - use the add bug button or resolve manually in Bugzilla to deal with any that are misdetected.',
    others: 'These changesets do not appear to have a bug associated with them. Review these changesets, and comment in Bugzilla manually as necessary.'
};


Step.headings = {
    fixes: 'Fixes',
    foundBackouts: 'Pushes backed out',
    notFoundBackouts: 'Backouts of things not in this merge',
    merges: 'Merge Changesets',
    others: 'Other Changesets'
};

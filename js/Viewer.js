"use strict";

var Viewer = {
  addRemoveButtonListener: function viewer_addRemoveButtonListener(cset, bug) {
    $('#' + this.getRemoveButtonID(cset, bug)).one('click', this.onRemoveButtonClick);
  },


  addChangeButtonListener: function viewer_addChangeButtonListener(cset, bug) {
    $('#' + this.getChangeButtonID(cset, bug)).one('click', this.onChangeButtonClick);
  },


  addCommentCheckListener: function viewer_addCommentCheckListener(cset, bug) {
    $('#' + this.getCommentCheckID(cset, bug)).on('change', this.onCommentCheckClick);
  },


  addResolveCheckListener: function viewer_addResolveCheckListener(cset, bug) {
    $('#' + this.getResolveCheckID(cset, bug)).on('change', this.onResolveCheckClick);
  },


  addViewHideListener: function viewer_addResolveCheckListener(cset, bug) {
    $('#' + this.getViewHideID(cset, bug)).click(this.onViewHideClick);
  },


  addCommentChangeListener: function viewer_addCommentChangeListener(cset, bug) {
    $('#' + this.getCommentTextAreaID(cset, bug)).on('input', this.onCommentInput);
  },


  addWhiteboardChangeListener: function viewer_addWhiteboardChangeListener(cset, bug) {
    $('#' + this.getWhiteboardID(cset, bug)).on('input', this.onWhiteboardInput);
  },


  addMilestoneChangeListener: function viewer_addMilestoneChangeListener(cset, bug) {
    $('#' + this.getMilestonesID(cset, bug)).on('change', this.onMilestoneChange);
  },


  addBug: function viewer_attachBug(index, bugID) {
    var cset = PushData.allPushes[index].cset;

    var bugHTML = this.makeBugHTML(index, bugID);
    $('#' + this.getBugDivID(cset)).prepend(bugHTML);

    // Hook up listeners
    this.addRemoveButtonListener(cset, bugID);
    this.addChangeButtonListener(cset, bugID);
    this.addCommentCheckListener(cset, bugID);
    this.addResolveCheckListener(cset, bugID);
    this.addViewHideListener(cset, bugID);
    this.addCommentChangeListener(cset, bugID);
    this.addWhiteboardChangeListener(cset, bugID);
    this.addMilestoneChangeListener(cset, bugID);
    this.updateSubmitButton();
  },


  // Assumes the bug has already been removed from attachedBugs[cset]
  removeBug: function viewer_removeBug(index, id) {
    var cset = PushData.allPushes[index].cset;
    $('#' + this.getBugCsetID(cset, id)).remove();
    this.updateSubmitButton();
  },


  onAddButtonClick: function viewer_onAddButtonClick(e) {
    e.preventDefault();
    var target = e.target;
    if (!target.hasAttribute('data-index')) {
      UI.showErrorMessage('Add button clicked without data!');
      return;
    }

    var index = target.getAttribute('data-index');
    UI.showBugLoadForm(index);
  },


  onRemoveButtonClick: function viewer_onRemoveButtonClick(e) {
    e.preventDefault();
    var target = e.target;

    if (!target.hasAttribute('data-index') || !target.hasAttribute('data-bug')) {
      UI.showErrorMessage('Remove button clicked with no data!');
      return;
    }

    var index = target.getAttribute('data-index');
    var bug = target.getAttribute('data-bug');
    ViewerController.removeBug(index, bug);
  },


  onViewHideClick: function viewer_onViewHideClick(e) {
    e.preventDefault();
    var target = e.target;

    if (!target.hasAttribute('data-index') || !target.hasAttribute('data-bug')) {
      UI.showErrorMessage('View/hide clicked with no data!');
      return;
    }

    var cset = PushData.allPushes[target.getAttribute('data-index')].cset;
    var bug = target.getAttribute('data-bug');
    $('#' + Viewer.getCommentID(cset, bug)).toggle();
  },


  onCommentInput: function viewer_onCommentInput(e) {
    e.preventDefault();
    var target = e.target;

    if (!target.hasAttribute('data-index') ||
        !target.hasAttribute('data-bug')) {
      UI.showErrorMessage('Comment changed with no data!');
      return;
    }

    var index = target.getAttribute('data-index');
    var bug = target.getAttribute('data-bug');
    ViewerController.onCommentInput(index, bug, target.value);
  },


  onWhiteboardInput: function viewer_onWhiteboardInput(e) {
    e.preventDefault();
    var target = e.target;

    if (!target.hasAttribute('data-index') ||
        !target.hasAttribute('data-bug')) {
      UI.showErrorMessage('Whiteboard changed with no data!');
      return;
    }

    var index = target.getAttribute('data-index');
    var bug = target.getAttribute('data-bug');
    $('.' + bug + 'whiteboard').val(target.value); 
    ViewerController.onWhiteboardInput(index, bug, target.value);
  },


  onResolveCheckClick: function viewer_onResolveCheckClick(e) {
    e.preventDefault();
    var target = e.target;

    if (!target.hasAttribute('data-index') ||
        !target.hasAttribute('data-bug')) {
      UI.showErrorMessage("Resolve checkbox clicked with no data!");
      return;
    }

    var index = target.getAttribute('data-index');
    var bug = target.getAttribute('data-bug');

    // Update all other instances of this bug
    $('.'+bug+'resolvecheck').prop('checked', this.checked);

    // If we've turned it off, also turn off milestone selection
    // (we don't support setting the milestone without setting the
    // resolution).
    $('.'+bug+'Milestone').attr('disabled', !this.checked);

    ViewerController.onResolveCheckClick(bug, this.checked);
  },


  onCommentCheckClick: function viewer_onCommentCheckClick(e) {
    e.preventDefault();
    var target = e.target;

    if (!target.hasAttribute('data-index') ||
        !target.hasAttribute('data-bug')) {
      UI.showErrorMessage('Comment checkbox clicked with no data!');
      return;
    }

    var index = target.getAttribute('data-index');
    var bug = target.getAttribute('data-bug');
    ViewerController.onCommentCheckClick(index, bug, this.checked);
  },


  onMilestoneChange: function viewer_onMilestoneChange(e) {
    e.preventDefault();
    var target = e.target;

    if (!target.hasAttribute('data-index') ||
        !target.hasAttribute('data-bug')) {
      UI.showErrorMessage('Milestone changed with no data!');
      return;
    }

    var index = target.getAttribute('data-index');
    var bug = target.getAttribute('data-bug');
    // Update all other instances of this bug
    $('.'+bug+'Milestone').val(target.value);
    ViewerController.onMilestoneChange(bug, target.value);
  },


  onChangeButtonClick: function viewer_onChangeButtonClick(e) {
    e.preventDefault();
    var target = e.target;
    if (!target.hasAttribute('data-index') || !target.hasAttribute('data-bug')) {
      UI.showErrorMessage('Change button clicked without data!');
      return;
    }

    var index = target.getAttribute('data-index');
    var bug = target.getAttribute('data-bug');
    UI.showBugChangeForm(index, bug);
  },


  onExpandButtonClick: function viewer_onExpandButtonClick(e) {
    e.preventDefault();

    $('.commentDiv').toggle();
  },


  onSubmitButtonClick: function viewer_onSubmitButtonClick(e) {
    e.preventDefault();

    this.step.onSubmit();
  },


  getAddBugIDForCset: function viewer_getAddBugIDForPush(index) {
    return 'addBug' + index;
  },


  getBugCsetID: function viewer_getBugCsetID(cset, id) {
    return cset + id;
  },


  getMilestonesID: function viewer_getMilestones(cset, id) {
    return cset + id + 'Milestones';
  },


  getViewHideID: function viewer_getViewHideID(cset, id) {
    return cset + id + 'ViewHide';
  },


  getCommentCheckID: function viewer_getCommentCheckID(cset, id) {
    return cset + id + 'CommentCheck';
  },


  getResolveCheckID: function viewer_getResolveCheckID(cset, id) {
    return cset + id + 'ResolveCheck';
  },


  getRemoveButtonID: function viewer_getRemoveButtonID(cset, id) {
    return cset + id + 'Remove';
  },


  getChangeButtonID: function viewer_getChangeButtonID(cset, id) {
    return cset + id + 'Change';
  },


  getCommentID: function viewer_getCommentID(cset, id) {
    return cset + id + 'Comment';
  },


  getCommentTextAreaID: function viewer_getCommentTextAreaID(cset, id) {
    return cset + id + 'CommentText';
  },


  getWhiteboardID: function viewer_getWhiteboardID(cset, id) {
    return cset + id + 'Whiteboard';
  },


  getBugDivID: function viewer_getBugDivID(cset) {
    return cset + 'Bugs';
  },


  makeDataHTML: function viewer_makeDataHTML(index, bug) {
    bug = bug || null;
    var html = 'data-index="' + index + '" ';
    if (bug)
      html += 'data-bug="' + bug + '" ';
    return html;
  },


  makeMilestoneSelectHTML: function viewer_makeMilestoneSelectHTML(cset, index, id) {
    var html = '<select id="';
    html += this.getMilestonesID(cset, id);
    html += '" class="milestone ' + id + 'Milestone"';
    html += ' ' + this.makeDataHTML(index, id);
    if (!this.step.canResolve(id) || !this.step.shouldResolve(id) || !this.step.canSetMilestone(id))
      html += ' disabled="true"';
    html += '>';
    var product = BugData.bugs[id].product;
    var milestones = MilestoneData.milestones[product].values;
    var defaultMilestone = this.step.getMilestone(id);
    for (var i = 0; i < milestones.length; i++) {
      html += '<option value="' + milestones[i] + '"';
      if (milestones[i] == defaultMilestone)
        html += ' selected';
      html += '>' + milestones[i] + '</option>';
    }
    html += '</select>';
    return html;
  },


  makeRemoveButtonHTML: function viewer_makeRemoveButtonHTML(cset, index, id) {
     var html = '<button class="removeButton" id="' + this.getRemoveButtonID(cset, id) + '" ';
     html += this.makeDataHTML(index, id);
     html += ' type="button">Remove</button>';
     return html;
  },


  makeChangeButtonHTML: function viewer_makeChangeButtonHTML(cset, index, bug) {
     var html = '<button class="changeButton" id="' + this.getChangeButtonID(cset, bug) + '" ';
     html += this.makeDataHTML(index, bug);
     html += ' type="button">Change</button>';
     return html;
  },


  makeCheckboxHTML: function viewer_makeCheckboxHTML(cset, index, id, type) {
    var upperType = type.charAt(0).toUpperCase() + type.slice(1);
    var html = '<input type="checkbox" class="' + type + 'Check';
    html += ' ' + id + type + 'check" value="' + type + '"';
    var canProp = "can" + upperType;
    var shouldProp = "should" + upperType;
    var idFn = 'get' + upperType + 'CheckID';
    html += ' name="' + this[idFn](cset,id) + '"';
    html += ' id="' + this[idFn](cset, id) + '" ';
    html += this.makeDataHTML(index, id);
    if (this.step.isAttached(index, id) && this.step.getProp(index, id, shouldProp))
      html  += ' checked="checked"';
    if (!this.step.isAttached(index, id) || !this.step.getProp(index, id, canProp))
      html  += ' disabled="disabled"';
    html += ' />';
    return html;
  },


  makeCommentHTML: function viewer_makeCommentHTML(cset, index, id) {
    var html = 'Comment: ';
    html += '<textarea class="comment" rows="3" cols="60" id="' + this.getCommentTextAreaID(cset, id);
    html += '" ' + this.makeDataHTML(index, id);
    if (!this.step.canComment(index, id))
      html += ' disabled="true"';
    html += '>';
    html += this.step.getComment(index, id);
    html += '</textarea>';
    return html;
  },


  makeWhiteboardHTML: function viewer_makeWhiteBoardHTML(cset, index, id) {
    var bug = BugData.bugs[id];
    var html = '<textarea class="whiteboardTA ' + id + 'whiteboard" rows="3" id="' + this.getWhiteboardID(cset, id);
    html += '" ' + this.makeDataHTML(index, id) + '>';
    if (bug.whiteboard)
      html += bug.whiteboard.replace(/]/g, ']\n');
    html += '</textarea>';
    return html;
  },


  makeBugHTML: function viewer_makeBugHTML(index, id) {
    var html = '';

    var bug = BugData.bugs[id];
    // Need to use the cset rather than index for unique IDs
    // otherwise we could have eg index 8 bug 765432 and index 87 bug 65432 generating non-unique IDs
    var cset = PushData.allPushes[index].cset;

    html += '    <div class="bug'
    if (bug && (bug.status == 'RESOLVED' || bug.status == 'VERIFIED'))
      html += ' resolved';
    html += '" id="' + this.getBugCsetID(cset, id) + '">';
    html += '      <div class="grid-3">Bug ' + UI.linkifyBug(id) + '</div>';
    html += '      <div class="grid-3">';
    if (bug)
      html += bug.status + " " + bug.resolution;
    html += '      </div>';
    html += '      <div class="grid-3">';
    if (bug)
      html += this.makeMilestoneSelectHTML(cset, index, id);
    html += '      </div>';
    html += '      <div class="grid-3 divRight">';
    html += this.makeRemoveButtonHTML(cset, index, id);
    html += this.makeChangeButtonHTML(cset, index, id);
    html += '</div>';
    html += '       <div class="grid-12">';
    if (bug)
      html += UI.linkifyDescription(bug.summary);
    else
      html += "<em>Unable to load bug " + id + " - security bug?</em>";
    html += '</div>'
    if (bug) {
      html += '       <div class="grid-3">Whiteboard:</div>';
      html += '       <div class="grid-3 whiteboard">';
      html += this.makeWhiteboardHTML(cset, index, id);
      html += '       </div>';
    } else
      html += '<div class="grid-3"></div><div class="grid-3"></div>';
    html += '<div class="grid-3 afterWhiteboard">';
    html += '<span class="viewhide" id="' + this.getViewHideID(cset, id) + '" ';
    html += this.makeDataHTML(index, id) + '>View/hide comment</span></div>';
    html += '<div class="grid-3 afterWhiteboard">Comment: ';
    html += this.makeCheckboxHTML(cset, index, id, 'comment');
    html += ' Resolve: ';
    html += this.makeCheckboxHTML(cset, index, id, 'resolve');
    html += '</div>';
    html += '<div class="grid-12 commentDiv" id ="' + this.getCommentID(cset, id) + '">';
    html += this.makeCommentHTML(cset, index, id);
    html += '</div>';
    html += '</div>';

    return html;
  },


  makeBugDivHTML: function viewer_makeBugDivHTML(index) {
    var html = '  <div id="' + this.getBugDivID(index) + '">';
    html += '    </div>';
    return html;
  },



  makeHTMLForChangeset: function viewer_makeHTMLForChangeset(index, classToAdd) {
    var html = "";
    var cset = PushData.allPushes[index].cset;
    var desc = PushData.allPushes[index].desc;
    var author = PushData.allPushes[index].author;
    html += '<div class="changeset';
    if (classToAdd != '')
      html += ' ' + classToAdd;
    html += '">';
    html += '  <div class="csetHead">';
    html += '    <div class="csetTitle';
    if (classToAdd != '')
      html += ' ' + classToAdd;
    html += '">';
    html += '      <div class="grid-12">Changeset: '+ UI.linkifyChangeset(cset) + '</div>';
    html += '    </div>';
    html += '      <div class="grid-12">'+ author + '</div>';
    html += '    <div class="grid-two-thirds">' + UI.linkifyDescription(desc);
    html += '    </div>';
    html += '    <div class="grid-one-third divRight">';
    html += '      <button class="addBug" ' + this.makeDataHTML(index);
    html += ' id="' + this.getAddBugIDForCset(index) + '" type="button">Add Bug</button>';
    html += '    </div>';
    html += '  </div>';

    return html;
  },


  makeBackoutBannerHTML: function viewer_makeBackoutBannerHTML() {
    var html = '<div class="backoutbanner ctr" id="';
    html += '">BACKED OUT BY</div>';
   return html;
  },


  makeButtonHTML: function viewer_makeButtonHTML(prevLabel, nextLabel) {
    var html = '<div class="grid-4">';
    html += '  <button type="button" class="prevButton">' + prevLabel + '</button>';
    html += '</div>';
    html += '<div class="grid-4"></div>';
    html += '<div class="grid-4 divRight">';
    html += '  <button type="button" class="nextButton">' + nextLabel + '</button>';
    html += '</div>'
    return html;
  },


  makeOnNextHTML: function viewer_makeOnNextHTML() {
    var html = '<div class="grid-12 divRight">';
    html += '  <button type="button" id="nextButton">Next</button>';
    html += '</div>'

    return html;
  },


  makeExpandHTML: function viewer_makeExpandHTML() {
    var html = '<div class="grid-12 divRight" id="expand">';
    html += '  <button type="button" id="expandButton">Expand/Hide all comments</button>';
    html += '</div>';
    return html;
  },


  makeSubmitHTML: function viewer_makeSubmitHTML() {
    var html = '<div class="grid-12 divRight" id="submit">';
    html += '  <button type="button" id="submitButton">Submit the changes above</button>';
    html += '</div>';
    return html;
  },


  makeHeadlineHTML: function viewer_makeHeadlineHTML(headline) {
    var html = '<div class="grid-12" id="headline">';
    html += '<h3>' + headline + '</h3>';
    html += '</div>';
    return html;
  },


  makeHelpHTML: function viewer_buildHelp(helpText) {
    var html = '<p class="grid-12" id="helpText">';
    html += helpText;
    html += '</p>';
    return html;
  },


  updateHelpText: function viewer_updateHelpText() {
    $('#helpText').replaceWith(this.makeHelpHTML(this.step.getHelpText()));
  },


  updateSubmitButton: function viewer_updateSubmitButton() {
    $('#submitButton').attr('disabled', !(this.step.canSubmit()));
  },


  addChangeset: function viewer_addChangeset(index, isLast, classToAdd) {
    classToAdd = classToAdd || '';
    if (isLast)
      classToAdd += ' last';
    // build HTML for changeset part
    var pushHTML = this.makeHTMLForChangeset(index, classToAdd);
    pushHTML += this.makeBugDivHTML(PushData.allPushes[index].cset);
    // build html for bugs
    var attachedBugs = this.step.getAttachedBugs(index);
    if (attachedBugs.length == 0)
      return pushHTML +' </div>';

    pushHTML += attachedBugs.map(function viewer_addChangsetBugHTMLMaker(j) {return this.makeBugHTML(index, j);},this).join('');
    pushHTML += '</div>';
    return pushHTML;
  },



  view: function view_View(step, onPrevious, onNext) {
    // Hide any previous viewer output
    UI.hide('viewerOutput');
    UI.clearErrorMessage();
    $('#viewerOutput').empty();

    $('#viewerOutput').append(this.makeHeadlineHTML(step.getHeading()));
    $('#viewerOutput').append(this.makeHelpHTML(step.getHelpText()));
    $('#viewerOutput').append(this.makeExpandHTML());
    $('#viewerOutput').append(this.makeButtonHTML(onPrevious.label, onNext.label));

    this.step = step;
    var isBackedOut = step.hasBackouts;
    var pushes = PushData[step.getName()];
    var len = pushes.length;

    if (!isBackedOut) {
      var html = pushes.map(function viewer_ViewChangesetMaker(i, ind, arr) {return this.addChangeset(i, ind == arr.length - 1);}, this).join('');
      $('#viewerOutput').append(html);
    } else {
      var html = pushes.map(function viewer_ViewChangesetMaker2(i, ind, arr) {
        var h = PushData.allPushes[i].affected.map(function viewer_ViewBackoutMaker(j) {return this.addChangeset(j, false, 'backedout');}, this).join('');
        return h + this.makeBackoutBannerHTML() + this.addChangeset(i, ind == arr.length - 1, 'backout');
      }, this).join('');
      $('#viewerOutput').append(html);
    }

    // Add listeners
    $('.addBug').click(this.onAddButtonClick);
    $('.removeButton').one('click', this.onRemoveButtonClick);
    $('.changeButton').one('click', this.onChangeButtonClick);
    $('.viewhide').click(this.onViewHideClick);
    $('.comment').on('input', this.onCommentInput);
    $('.whiteboardTA').on('input', this.onWhiteboardInput);
    $('.resolveCheck').on('change', this.onResolveCheckClick);
    $('.commentCheck').on('change', this.onCommentCheckClick);
    $('.milestone').on('change', this.onMilestoneChange);

    $('#viewerOutput').append(this.makeSubmitHTML());
    $('#viewerOutput').append(this.makeButtonHTML(onPrevious.label, onNext.label));
    if (onPrevious.fn) {
      $('.prevButton').click(function viewer_ViewOnPrevious(e) {
        onPrevious.fn();
      });
    } else {
      $('.prevButton').attr('disabled', true);
    }
    if (onNext.fn) {
      $('.nextButton').click(function viewer_ViewOnNext(e) {
        onNext.fn();
      });
    } else {
      $('.nextButton').attr('disabled', true);
    }

    var self = this;
    $('#expandButton').click(function viewer_ViewExpandButtonClick(e) {
      self.onExpandButtonClick(e);
    });

    $('#submitButton').click(function viewer_ViewSubmitButtonClick(e) {
      self.onSubmitButtonClick(e);
    });

    this.updateSubmitButton();

    if (Viewer.expand)
      $('.commentDiv').toggle();

    UI.show('viewerOutput');
    $('html')[0].scrollIntoView();
  }
}

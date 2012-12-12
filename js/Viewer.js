"use strict";

var Viewer = {
  init: function viewer_init() {
    function bindListener(fn, that) {
      return function (e) {
        fn.call(that, e);
      };
    }

    var self = this;
    $('#viewerOutput').click(bindListener(self.clickListener, self));
    $('#viewerOutput').on('input', bindListener(self.inputListener, self));
    $('#viewerOutput').on('change', bindListener(self.changeListener, self));
  },

  clickListener: function viewer_clickListener(e) {
    var listenerDict = {
      'addBug'      : {func: this.onAddButtonClick,    preventDefault: true},
      'changeButton': {func: this.onChangeButtonClick, preventDefault: true},
      'removeButton': {func: this.onRemoveButtonClick, preventDefault: true},
      'commentCheck': {func: this.onCommentCheckClick, preventDefault: false},
      'resolveCheck': {func: this.onResolveCheckClick, preventDefault: false},
      'reopenCheck' : {func: this.onReopenCheckClick,  preventDefault: false},
      'viewhide'    : {func: this.onViewHideClick,     preventDefault: true},
      'fileviewhide': {func: this.onFileViewHideClick, preventDefault: true},
      'expandButton': {func: this.onExpandButtonClick, preventDefault: true},
      'submitButton': {func: this.onSubmitButtonClick, preventDefault: true},
      'prevButton'  : {func: this.onPrevious,          preventDefault: true},
      'nextButton'  : {func: this.onNext,              preventDefault: true}
    };

    var className = e.target.className.split(' ')[0];
    if (!(className in listenerDict))
      return;

    if (listenerDict[className].preventDefault)
      e.preventDefault();
    listenerDict[className].func.call(this, e.target);
  },


  inputListener: function viewer_inputListener(e) {
    var listenerDict = {
      'comment': this.onCommentInput,
      'whiteboardTA': this.onWhiteboardInput
    };

    var className = e.target.className.split(' ')[0];
    if (!(className in listenerDict))
      return;

    listenerDict[className].call(this, e.target);
  },


  changeListener: function viewer_changeListener(e) {
    var listenerDict = {
      'milestone': this.onMilestoneChange,
      'testsuite': this.onTestsuiteChange
    };

    var className = e.target.className.split(' ')[0];
    if (!(className in listenerDict))
      return;

    listenerDict[className].call(this, e.target);
  },


  addBug: function viewer_attachBug(index, bugID) {
    var cset = PushData.allPushes[index].cset;

    var bugHTML = this.makeBugHTML(index, bugID);
    $('#' + this.getBugDivID(cset)).prepend(bugHTML);

    this.updateSubmitButton();
  },


  // Assumes the bug has already been removed from attachedBugs[cset]
  removeBug: function viewer_removeBug(index, id) {
    var cset = PushData.allPushes[index].cset;
    $('#' + this.getBugCsetID(cset, id)).remove();
    this.updateSubmitButton();
  },


  onAddButtonClick: function viewer_onAddButtonClick(target) {
    if (!target.hasAttribute('data-index')) {
      UI.showErrorMessage('Add button clicked without data!');
      return;
    }

    var index = target.getAttribute('data-index');
    UI.showBugLoadForm(index);
  },


  onRemoveButtonClick: function viewer_onRemoveButtonClick(target) {
    if (!target.hasAttribute('data-index') || !target.hasAttribute('data-bug')) {
      UI.showErrorMessage('Remove button clicked with no data!');
      return;
    }

    var index = target.getAttribute('data-index');
    var bug = target.getAttribute('data-bug');
    ViewerController.removeBug(index, bug);
  },


  onViewHideClick: function viewer_onViewHideClick(target) {
    if (!target.hasAttribute('data-index') || !target.hasAttribute('data-bug')) {
      UI.showErrorMessage('View/hide clicked with no data!');
      return;
    }

    var cset = PushData.allPushes[target.getAttribute('data-index')].cset;
    var bug = target.getAttribute('data-bug');
    $('#' + this.getCommentID(cset, bug)).toggle();
  },


  onFileViewHideClick: function viewer_onFileViewHideClick(target) {
    if (!target.hasAttribute('data-index')) {
      UI.showErrorMessage('View/hide clicked with no data!');
      return;
    }

    var cset = target.getAttribute('data-index');
    $('#' + this.getFilesID(cset)).toggle();
  },


  onCommentInput: function viewer_onCommentInput(target) {
    if (!target.hasAttribute('data-index') ||
        !target.hasAttribute('data-bug')) {
      UI.showErrorMessage('Comment changed with no data!');
      return;
    }

    var index = target.getAttribute('data-index');
    var bug = target.getAttribute('data-bug');
    ViewerController.onCommentInput(index, bug, target.value);
  },


  onWhiteboardInput: function viewer_onWhiteboardInput(target) {
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


  onResolveCheckClick: function viewer_onResolveCheckClick(target) {
    if (!target.hasAttribute('data-index') ||
        !target.hasAttribute('data-bug')) {
      UI.showErrorMessage("Resolve checkbox clicked with no data!");
      return;
    }

    var index = target.getAttribute('data-index');
    var bug = target.getAttribute('data-bug');

    // Update all other instances of this bug
    $('.'+bug+'resolvecheck').attr('checked', target.checked);

    // If we've turned it off, also turn off milestone selection
    // (we don't support setting the milestone without setting the
    // resolution).
    $('.'+bug+'Milestone').attr('disabled', !target.checked);

    ViewerController.onResolveCheckClick(bug, target.checked);
  },


  onReopenCheckClick: function viewer_onReopenCheckClick(target) {
    if (!target.hasAttribute('data-index') ||
        !target.hasAttribute('data-bug')) {
      UI.showErrorMessage("Reopen checkbox clicked with no data!");
      return;
    }

    var index = target.getAttribute('data-index');
    var bug = target.getAttribute('data-bug');

    // Update all other instances of this bug
    $('.'+bug+'reopencheck').attr('checked', target.checked);

    // If we've turned it on, also turn on commenting - I don't think
    // you would ever backout a bug without an explanation!
    this.unsetComments(bug, target.checked);
    ViewerController.onReopenCheckClick(bug, target.checked);
  },


  onCommentCheckClick: function viewer_onCommentCheckClick(target) {
    if (!target.hasAttribute('data-index') ||
        !target.hasAttribute('data-bug')) {
      UI.showErrorMessage('Comment checkbox clicked with no data!');
      return;
    }

    var index = target.getAttribute('data-index');
    var bug = target.getAttribute('data-bug');
    ViewerController.onCommentCheckClick(index, bug, target.checked);

    // Comments and reopening are dependent
    if (ViewerController.getCurrentStep().canReopen(bug)) {
      this.unsetComments(bug, target.checked);
      var elems = $('.' + bug + 'reopencheck');
      if (elems.length > 0 && elems.attr('checked') != target.checked)
        elems[0].click();
    }
  },


  unsetComments: function viewer_unsetComments(bug, checked) {
    var elems = $('.' + bug + 'commentcheck');
    var l = elems.length;
    for (var i = 0; i < l; i++) {
      var elem = elems[i];
      if (elem.getAttribute('checked') != checked) {
        var index = elem.getAttribute('data-index');
        ViewerController.onCommentCheckClick(index, bug, checked);
      }
    }
    elems.attr('checked', checked);
  },


  onMilestoneChange: function viewer_onMilestoneChange(target) {
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


  onTestsuiteChange: function viewer_onTestsuiteChange(target) {
    if (!target.hasAttribute('data-index') ||
        !target.hasAttribute('data-bug')) {
      UI.showErrorMessage('Testsuite changed with no data!');
      return;
    }

    var index = target.getAttribute('data-index');
    var bug = target.getAttribute('data-bug');
    // Update all other instances of this bug
    $('.'+bug+'Testsuite').val(target.value);
    ViewerController.onTestsuiteChange(bug, target.value);
  },


  onChangeButtonClick: function viewer_onChangeButtonClick(target) {
    if (!target.hasAttribute('data-index') || !target.hasAttribute('data-bug')) {
      UI.showErrorMessage('Change button clicked without data!');
      return;
    }

    var index = target.getAttribute('data-index');
    var bug = target.getAttribute('data-bug');
    UI.showBugChangeForm(index, bug);
  },


  onExpandButtonClick: function viewer_onExpandButtonClick(target) {
    $('.commentDiv').toggle();
  },


  onSubmitButtonClick: function viewer_onSubmitButtonClick(target) {
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


  getTestsuiteID: function viewer_getTestsuiteID(cset, id) {
    return cset + id + 'Testsuite';
  },


  getViewHideID: function viewer_getViewHideID(cset, id) {
    return cset + id + 'ViewHide';
  },


  getFilesID: function viewer_getFilesID(cset) {
    return cset + 'Files';
  },


  getCommentCheckID: function viewer_getCommentCheckID(cset, id) {
    return cset + id + 'CommentCheck';
  },


  getResolveCheckID: function viewer_getResolveCheckID(cset, id) {
    return cset + id + 'ResolveCheck';
  },


  getReopenCheckID: function viewer_getReopenCheckID(cset, id) {
    return cset + id + 'ReopenCheck';
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
    var milestones = ConfigurationData.milestones[product].values;
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


  makeTestsuiteHTML: function viewer_makeTestsuiteHTML(cset, index, id) {
    var html = '<select id="';
    html += this.getTestsuiteID(cset, id);
    html += '" class="testsuite ' + id + 'Testsuite"';
    html += ' ' + this.makeDataHTML(index, id);
    html += '>';
    var statuses = [' ', '?', '+', '-'];
    var defaultStatus = this.step.getTestsuite(id);
    for (var i = 0; i < statuses.length; i++) {
      html += '<option value="' + statuses[i] + '"';
      if (statuses[i] == defaultStatus)
        html += ' selected';
      html += '>' + statuses[i] + '</option>';
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
    if (!this.step.isAttached(index, id) || !this.step.getProp(index, id, canProp)) {
      html  += ' disabled="disabled"';
    }
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
      html += '       <div class="grid-6 whiteboard">Whiteboard:';
      html += this.makeWhiteboardHTML(cset, index, id);
      html += '       </div>';
    } else
      html += '<div class="grid-6"></div>';
    html += '<div class="grid-6 afterWhiteboard">';
    html += '<span class="afterWhiteboard">';
    html += 'Comment: ';
    html += this.makeCheckboxHTML(cset, index, id, 'comment');
    html += ' Resolve: ';
    html += this.makeCheckboxHTML(cset, index, id, 'resolve');
    html += '</span>';
    if (this.step.canReopen(id)) {
      html += '<br><span class="afterWhiteboard">Reopen: ';
      html += this.makeCheckboxHTML(cset, index, id, 'reopen');
      html += '</span>';
    } else
      html += '<br>';
    if (bug && bug.canSetTestsuite) {
      html += '<span class="afterWhiteboard">In-testsuite: ';
      html += this.makeTestsuiteHTML(cset, index, id);
      html += '</span><br>';
    } else
      html += '<br>';
    html += '<br>';
    html += '<span class="afterWhiteboard">';
    html += '<span class="viewhide" id="' + this.getViewHideID(cset, id) + '" ';
    html += this.makeDataHTML(index, id) + '>View/hide comment</span></span></div>';
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
    var files = PushData.allPushes[index].files;
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
    html += '    <div class="grid-12"><span class="fileviewhide" ';
    html += this.makeDataHTML(cset) + '>View/hide files</span></div>';
    html += '  </div>';
    html += '  <div class="files hiddenContent" id="' + this.getFilesID(cset) + '">';
    for (var i = 0; i < files.length; i++)
      html += UI.htmlEncode(files[i]) + '<br />';
    html += '    <span class="fileviewhide" ';
    html += this.makeDataHTML(cset) + '>Hide</span>';
    html += '    </div>';

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


  makeExpandHTML: function viewer_makeExpandHTML() {
    var html = '<div class="grid-12 divRight" id="expand">';
    html += '  <button type="button" class="expandButton" id="expandButton">Expand/Hide all comments</button>';
    html += '</div>';
    return html;
  },


  makeSubmitHTML: function viewer_makeSubmitHTML() {
    var html = '<div class="grid-12 divRight" id="submit">';
    html += '  <button type="button" class="submitButton" id="submitButton">Submit the changes above</button>';
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

    $('#viewerOutput').append(this.makeSubmitHTML());
    $('#viewerOutput').append(this.makeButtonHTML(onPrevious.label, onNext.label));
    if (onPrevious.fn)
      this.onPrevious = onPrevious.fn;
    else
      $('.prevButton').attr('disabled', true);
    if (onNext.fn)
      this.onNext = onNext.fn;
    else 
      $('.nextButton').attr('disabled', true);

    this.updateSubmitButton();

    if (Viewer.expand)
      $('.commentDiv').toggle();

    UI.show('viewerOutput');
    $('html')[0].scrollIntoView();
  }
}

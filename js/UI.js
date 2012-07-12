"use strict";

var UI = {
  hideAll: function UI_hideAll() {
    var selector = '.hideAll';
    $(selector).addClass('hiddenContent');
  },


  hide: function UI_hide(selector) {
    selector = '#' + selector;
    if (!$(selector).hasClass('hiddenContent'))
      $(selector).addClass('hiddenContent');
  },


  show: function UI_show(selector) {
    selector = '#' + selector;
    if ($(selector).hasClass('hiddenContent'))
      $(selector).removeClass('hiddenContent');
  },


  hideLoadingMessage: function UI_hideLoadingMessage(message) {
    this.hide('loading');
  },


  showLoadingMessage: function UI_showLoadingMessage(message) {
    this.hideAll();
    $('#loading').text(message);
    this.show('loading');
  },


  hideLoadingOverlay: function UI_hideLoadingOverlay() {
    $('#loadingModal').toggle();
    $('#opaque').toggle();
  },


  showLoadingOverlay: function UI_showLoadingOverlay() {
    $('#opaque').toggle();
    $('#loadingModal').toggle();
  },


  showInvalidEmailDialog: function UI_showInvalidEmailDialog() {
    this.hideLoadingOverlay();
    UI.showMessageModal('That didn\'t look like a valid email address!');
  },


  showInvalidBugDialog: function UI_showInvalidBugDialog() {
    this.hideLoadingOverlay();
    UI.showMessageModal('That didn\'t look like a valid bug number!');
  },


  showBugSubmitDialog: function UI_showBugSubmitDialog(sent, total) {
    $('#submissionMessage').attr('data-sent', sent);
    $('#submissionMessage').attr('data-max', total);
    $('#submissionMessage').dialog('open');
  },


  clearErrorMessage: function UI_clearErrorMessage() {
    this.hide('errors');
    $('#errorText').text('');
  },


  showErrorMessage: function UI_showErrorMessage(message) {
    this.hide('errors');
    $('#errorText').text(message);
    this.show('errors');
    $('html')[0].scrollIntoView();
  },


  hideProgressModal: function UI_hideProgressModal() {
    $('#progressModal').toggle();
    $('#opaque').toggle();
  },


  updateProgressModal: function UI_updateProgressModal(percentage) {
    percentage = Math.round(Number(percentage));
    $('#progressBar').attr('value', percentage);
    $('#progressText').text(percentage);
  },


  showProgressModal: function UI_showProgressModal() {
    $('#progressBar').attr('value', '0');
    $('#progressBar').attr('max', '100');
    $('#progressText').text('0');
    $('#opaque').toggle();
    $('#progressModal').toggle();
  },


  onCredentialsSubmit: function UI_onCredentialsSubmit(e) {
    e.preventDefault(); 
    $('#crCancel').unbind('click', UI.onCredentialsCancel);
    UI.hideCredentialsForm();
    ViewerController.onCredentialsEntered($('#username').val(), $('#password').val());
    $('#username').val('');
    $('#password').val('');
  },


  onCredentialsCancel: function UI_onCredentialsCancel(e) {
    e.preventDefault(); 
    $('#username').val('');
    $('#password').val('');
    $('#credentialsForm').unbind('submit', UI.onCredentialsSubmit);
    UI.hideCredentialsForm();
  },


  showCredentialsForm: function UI_showCredentialsForm() {
    $('#username').val('');
    $('#password').val('');
    $('#credentialsForm').one('submit', UI.onCredentialsSubmit);
    $('#crCancel').one('click', UI.onCredentialsCancel);
    $('#opaque').toggle();
    $('#credentialsModal').toggle();
    $('#username')[0].focus();
  },


  hideCredentialsForm: function UI_hideCredentialsForm() {
    $('#credentialsModal').toggle();
    $('#opaque').toggle();
  },


  onAddBugSubmit: function UI_onAddBugSubmit(e) {
    e.preventDefault(); 
    $('#abCancel').unbind('click', UI.onAddBugCancel);
    UI.hideBugLoadForm();
    var index = $('#addBugForm').attr('data-index');
    ViewerController.onAddBug(parseInt(index), $('#loadBug').val());
  },


  onAddBugCancel: function UI_onAddBugCancel(e) {
    e.preventDefault(); 
    $('#addBugForm').unbind('submit', UI.onAddBugSubmit);
    UI.hideBugLoadForm();
  },


  showBugLoadForm: function UI_showBugChangeForm(index) {
    var cset = PushData.allPushes[index].cset;
    $('#abTitle').text('Add bug to ' + cset);
    $('#loadBug').val('');
    $('#addBugForm').attr('data-index', index);
    $('#addBugForm').one('submit', UI.onAddBugSubmit);
    $('#abCancel').one('click', UI.onAddBugCancel);
    $('#opaque').toggle();
    $('#addBugModal').toggle();
    $('#loadBug')[0].focus();
  },


  hideBugLoadForm: function UI_hideBugLoadForm() {
    $('#addBugModal').toggle();
    $('#opaque').toggle();
  },


  onChangeBugSubmit: function UI_onChangeBugSubmit(e) {
    e.preventDefault(); 
    $('#cbCancel').unbind('click', UI.onChangeBugCancel);
    UI.hideBugChangeForm();
    var index = $('#changeBugForm').attr('data-index');
    var bug = $('#changeBugForm').attr('data-bug');
    ViewerController.onChangeBug(parseInt(index), bug, $('#changeBug')[0].value);
  },


  onChangeBugCancel: function UI_onChangeBugCancel(e) {
    e.preventDefault(); 
    $('#changeBugForm').unbind('submit', UI.onChangeBugSubmit);
    UI.hideBugChangeForm();
    var cset = $('#changeBugForm').attr('data-cset');
    var bug = $('#changeBugForm').attr('data-bug');
    Viewer.addChangeButtonListener(cset, bug);
  },


  showBugChangeForm: function UI_showBugChangeForm(index, bug) {
    var cset = PushData.allPushes[index].cset;
    $('#cbTitle').text('Change bug ' + bug + ' for ' + cset);
    $('#changeBug').val('');
    $('#changeBugForm').attr('data-index', index);
    $('#changeBugForm').attr('data-bug', bug);
    $('#changeBugForm').attr('data-cset', cset);
    $('#changeBugForm').one('submit', UI.onChangeBugSubmit);
    $('#cbCancel').one('click', UI.onChangeBugCancel);
    $('#opaque').toggle();
    $('#changeBugModal').toggle();
    $('#changeBug')[0].focus();
  },


  hideBugChangeForm: function UI_hideBugChangeForm() {
    $('#changeBugModal').toggle();
    $('#opaque').toggle();
  },


  showMessageModal: function UI_showMessageModal(message) {
    $('#mmText').text(message);

    var onOK = function() {
      $('#messageModal').toggle();
      $('#opaque').toggle();
    }

    $('#mmOK').one('click', onOK);
    $('#opaque').toggle();
    $('#messageModal').toggle();
    $('#mmOK')[0].focus();
  },


  showForm: function UI_showForm(listener) {
    this.hideAll();

    // Hook up click listener
    if (typeof listener == 'function')
      $('#revSubmit').one('click', listener);

    // Hook up submit button
    $('#changeset').one('keyup', function(e) {
      if (e.keyCode == 13)
        $('#revSubmit').click();
    });

    this.show('getCset');
  },


  showFormWithError: function UI_ShowFormWithError(listener, errorText) {
    // Call showForm first, as it will call hideAll
    this.showForm(listener);
    this.showErrorMessage(errorText);
  },


  linkifyChangeset: function UI_linkifyChangeset(cset) {
    var link = Config.hgRevURL;
    if (cset.indexOf(link) != -1)
      cset = cset.substring(link.length);
    link += cset;
    return '<a href="' + link + '" target="_blank">' + cset + '</a>';
  },


  linkifyRevURL: function UI_linkifyChangeset(revURL) {
    var cset = revURL;
    var link = Config.hgRevURL;
    if (cset.indexOf(link) != -1)
      cset = cset.substring(link.length);
    link += cset;
    return '<a href="' + link + '" target="_blank">' + revURL + '</a>';
  },


  linkifyBug: function UI_linkifyBug(bug) {
    return '<a href="' + Config.showBugURL + bug + '" target="_blank">' + bug + '</a>';
  },


  linkifyDescription: function UI_linkifyDescription(desc) {
    Config.csetIDRE.lastIndex = 0;
    Config.bugNumRE.lastIndex = 0;
    desc = desc.replace(Config.csetIDRE, this.linkifyChangeset);
    desc = desc.replace(Config.bugNumRE, this.linkifyBug);
    return desc;
  },


  buildMergeVerification: function UI_displayMergeVerification(sourceRepo) {
    var html = 'Merge ';
    if (sourceRepo)
      html += 'from <a href="' + Config.hgBaseURL + Config.treeInfo[sourceRepo].repo + '" target="_blank">' + sourceRepo.toLowerCase() + '</a> ';
    html += 'to <a href="' + Config.hgURL + '" target="_blank">mozilla-central</a>';
    return html;
  },


  displayDetail: function UI_displayDetail() {
    var tipCset = PushData.allPushes[PushData.allPushes.length - 1].cset;
    var numPushes = PushData.allPushes.length;
    var pushesParsed = 0;
    var pushTypes = ['fixes', 'backedOut', 'foundBackouts', 'notFoundBackouts', 'merges', 'others'];
    pushTypes.forEach(function(arr) {pushesParsed += PushData[arr].length});

    this.hide('detail');
    var html = '';


    html += this.buildMergeVerification(this.sourceRepo);
    html += ' (view <a href="' + Config.hgPushlogURL + tipCset + '" target="_blank">pushlog</a>).';
    $('#detail').html(html);
    this.show('detail');
    this.displayVerificationWarning(numPushes, pushesParsed);
  },


  displayVerificationWarning: function UI_displayVerificationWarning(rightLength, actualLength) {
    if (rightLength == actualLength)
      return;

    var errorText = 'Warning: Pushes length verification failed. (' + rightLength + ',' + actualLength + ')';
    errorText += 'Please ping :graememcc with this cset!';
    this.showErrorMessage(errorText);
  }
};

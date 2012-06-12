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
    LoadingOverlay.closeLoadingMessage();
  },


  showLoadingOverlay: function UI_showLoadingOverlay() {
    LoadingOverlay.showLoadingMessage();
  },


  showInvalidEmailDialog: function UI_showInvalidEmailDialog() {
    this.hideLoadingOverlay();
    $('#invalidEmailMessage').dialog("open");
  },


  showInvalidBugDialog: function UI_showInvalidBugDialog() {
    this.hideLoadingOverlay();
    $('#invalidBugMessage').dialog("open");
  },


  showCredentialsForm: function UI_showCredentialsForm() {
    $('#credentialsForm').dialog('open');
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


  showBugLoadForm: function UI_showBugChangeForm(index) {
    var cset = PushData.allPushes[index].cset;
    $('#bugLoadForm').attr('data-index', index);
    $('#bugLoadForm').dialog('option', 'title', 'Add bug to ' + cset);
    $('#bugLoadForm').dialog('open');
  },


  showBugChangeForm: function UI_showBugChangeForm(index, bug) {
    $('#bugChangeForm').attr('data-index', index);
    $('#bugChangeForm').attr('data-bug', bug);
    var cset = PushData.allPushes[index].cset;
    $('#bugChangeForm').attr('data-cset', cset);
    $('#bugChangeForm').dialog('option', 'title', 'Change bug ' + bug + ' for ' + cset);
    $('#bugChangeForm').dialog('open');
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

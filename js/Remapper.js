"use strict";

// The "remapper" will be shown when using the right incantation in the query string.
// It is an unsophisticated debug/testing shim, to allow submissions to be sent to
// the bzapi_sandbox bugzilla on landfill.bugzilla.org. Note that each unique real bug
// must be mapped to a unique landfill bug. If testing target milestone setting, the bug
// must be filed in the 'mcMerge Test Product' component.
//
// You do not have to supply a new bug number for every bug: however, only the bugs you
// have specified a new bug number for will be submitted.
//
// If you don't specify any, you will drop in to normal mode, and the changes will go
// to bugzilla.mozilla.org
var Remapper = {

  makeHTMLForBug: function rm_makeHTMLForBug(id) {
    var html = '<div class="grid-half">Remap bug for bug ' + id + '</div>';
    html += '<div class="grid-half"><input id="'+id+'" type="text"></div>';
    return html;
  },


  makeHTMLForOptions: function rm_makeHTMLForOptions() {
   var html = '<hr>';
   html += '<div class="grid-12"><h3>Other options:</h3></div>'
   html += '<div class="grid-12">Display an alert after fetching last_change_time (to allow you to mid-air the change)';
   html += '<input type="checkbox" id="midair"></div>';
   html += '<div class="grid-12">Set bug statuses to NEW (to allow you testing of bug resolution)';
   html += '<input type="checkbox" id="new"></div>';
   html += '<div class="grid-12">Add checkin-needed into keywords (to allow testing of checkin-needed removal)';
   html += '<input type="checkbox" id="checkin"></div>';
   html += '<div class="grid-12">Add [inbound] into whiteboard (to allow testing of [inbound] removal)';
   html += '<input type="checkbox" id="inbound"></div>';
   html += '<div class="grid-12">Add [fixed-in-fx-team] into whiteboard (to allow testing of [fixed-in-fx-team] removal)';
   html += '<input type="checkbox" id="fxteam"></div>';
   html += '<hr>';
   return html;
  },

  makeHTMLForSubmit: function rm_makeHTMLForSubmit() {
    var html = '<div class="grid-12 divRight" id="remsubmit">';
    html += '  <button type="button" id="remapSubmit">Submit</button>';
    html += '</div>';
    return html;
  },


  onSubmit: function rm_onSubmit() {
    var remaps = {items: 0};

    for (var b in BugData.bugs) {
      var val = $("#"+b).val().trim();
      if (val != '' && Config.strictBugNumRE.test(val)) {
        remaps[b] = val;
        remaps.items = remaps.items + 1;
      }
    }

    // Double-check that all the remapped bug numbers are unique
    // in order to counter my own stupidity
    var rm = [];
    var count = 0;
    for (b in remaps) {
      if (b == 'items')
        continue;
      count++;
      if (rm.indexOf(remaps[b]) == -1)
        rm.push(remaps[b]);
    }
    if (rm.length < count) {
      this.error("Some redirects are not unique");
      return;
    }

    if ($('#new').prop('checked')) {
      if (remaps.items == 0) {
        this.error('You need to redirect at least 1 bug for status changing to work!');
        return;
      }
      for (b in remaps) {
        if (b == 'items')
          continue;
        if (b in BugData.bugs) {
          BugData.bugs[b].status = 'NEW';
          BugData.bugs[b].resolution = '';
          BugData.bugs[b].canResolve = true;
        }
      }
    }

    if ($('#checkin').prop('checked')) {
      if (remaps.items == 0) {
        this.error('You need to redirect at least 1 bug for checkin-needed to work!');
        return;
      }
      var checkinSingle = false;
      for (b in remaps) {
        if (b == 'items')
          continue;
        if (b in BugData.bugs) {
          if (BugData.bugs[b].keywords.length == 0 && checkinSingle == false) {
            BugData.bugs[b].keywords.push('checkin-needed');
            checkinSingle = true;
          }
        }
      }
    }

    if ($('#inbound').prop('checked')) {
      if (remaps.items == 0) {
        this.error('You need to redirect at least 1 bug for inbound to work!');
        return;
      }
      var inboundSingle = false;
      var inboundMultiple = false;
      for (b in remaps) {
        if (b == 'items')
          continue;
        if (b in BugData.bugs) {
          if (BugData.bugs[b].whiteboard.length == 0 && inboundSingle == false) {
            BugData.bugs[b].whiteboard = '[inbound]'
            BugData.bugs[b].summary += ' [inbound]';
            inboundSingle = true;
          } else if (BugData.bugs[b].whiteboard.length > 0 && inboundMultiple == false) {
            BugData.bugs[b].whiteboard += '[inbound]';
            BugData.bugs[b].summary += ' [inbound]';
            inboundMultiple = true;
          }
        }
      }
    }

    if ($('#fxteam').prop('checked')) {
      if (remaps.items == 0) {
        this.error('You need to redirect at least 1 bug for fxteam to work!');
        return;
      }
      var fxteamSingle = false;
      var fxteamMultiple = false;
      for (b in remaps) {
        if (b == 'items')
          continue;
        if (b in BugData.bugs) {
          if (BugData.bugs[b].whiteboard.length == 0 && fxteamSingle == false) {
            BugData.bugs[b].whiteboard = '[fixed-in-fx-team]'
            BugData.bugs[b].summary += ' [fixed-in-fx-team]';
            fxteamSingle = true;
          } else if (BugData.bugs[b].whiteboard.length > 0 && fxteamMultiple == false) {
            BugData.bugs[b].whiteboard += '[fixed-in-fx-team]';
            BugData.bugs[b].summary += ' [fixed-in-fx-team]';
            fxteamMultiple = true;
          }
        }
      }
    }

    if ($('#midair').prop('checked')) {
      if (remaps.items == 0) {
        this.error('You need to redirect at least 1 bug for debug midairs to work!');
        return;
      }
      remaps.midair = true;
    } else
     remaps.midair = false;

    UI.clearErrorMessage();
    mcMerge.onRemap(remaps);
  },


  addSubmitListener: function rm_AddSubmitListener() {
    var self = this;
    var submitCallback = function(e) {
      e.preventDefault();

      self.onSubmit();
    }

    $('#remapSubmit').one('click', submitCallback);
  },


  error: function rm_error(message) {
    UI.showErrorMessage(message);
    this.addSubmitListener();
  },


  show: function rm_show() {
    // Hide any previous viewer output
    UI.hide("viewerOutput");
    $("#viewerOutput").empty("");

    var helpText = 'Enter bug numbers from the bzapi_sandbox bugzilla that output for a particular';
    helpText += ' bug should be redirected to. Please ensure that each bug is mapped to an unique sandbox bug!';
    helpText += '<br><strong>Note: if you do not supply any redirect bug numbers, you will return to normal mode';
    helpText += ', and changes will go to bugzilla.mozilla.org!</strong>';
    $("#viewerOutput").append('<div class="grid-12"><p>' + helpText + '</p></div>');

    for (var b in BugData.bugs)
      $("#viewerOutput").append(this.makeHTMLForBug(b));

    $("#viewerOutput").append(this.makeHTMLForOptions());
    $('#viewerOutput').append(this.makeHTMLForSubmit());
    this.addSubmitListener();
    UI.show("viewerOutput");
    $("html")[0].scrollIntoView();
  }
}

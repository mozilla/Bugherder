"use strict";

$(document).ready(function() {
  $('#loadingOverlay').dialog({
    autoOpen: false,
    dialogClass: 'loadingOverlay',
    closeOnEscape: false,
    draggable: false,
    width: 460,
    minHeight: 50,
    modal: true,
    buttons: {},
    resizable: false,
    open: function() {
      // scrollbar fix for IE
      $('body').css('overflow','hidden');
    },
    close: function() {
      // reset overflow
      $('body').css('overflow','auto');
    }
  });

  $('#bugLoadForm').dialog({
    autoOpen: false,
    height: 250,
    width: 350,
    modal: true,
    resizable: false,
    buttons: {
      'Add bug': function() {
        $(this).dialog('close');
        var cset = $(this).attr('data-cset');
        var index = $(this).attr('data-index');
        ViewerController.onAddBug(parseInt(index), $('#loadBug')[0].value);
      },
      'Cancel': function() {
        $(this).dialog('close');
      }
    },
    open: function() {
      $('#loadBug')[0].value = '';
      $('#loadBug').on('keyup', function (e) {
        if (e.keyCode == 13 && $('#bugLoadForm').is(':visible')) {
          $(':button:contains("Add bug")').click();
          return false;
        }
      });
    }
  });

  $('#credentialsForm').dialog({
    autoOpen: false,
    height: 250,
    width: 450,
    modal: true,
    resizable: false,
    buttons: {
      'Submit': function() {
        $(this).dialog("close");
        ViewerController.onCredentialsEntered($('#username').val(),$('#password').val());
        $('#username')[0].value = '';
        $('#password')[0].value = '';
      },
      'Cancel': function() {
        $(this).dialog('close');
        $('#username')[0].value = '';
        $('#password')[0].value = '';
      }
    },
    open: function() {
      $('#username')[0].value = '';
      $('#password')[0].value = '';
      $('#password').on('keyup', function (e) {
        if (e.keyCode == 13 && $('#credentialsForm').is(':visible') &&
            $('#username').val() != '' && $('#password').val() != '') {
          $(':button:contains("Submit")').click();
          return false;
        }
      });
    }
  });

  $('#bugChangeForm').dialog({
    autoOpen: false,
    height: 250,
    width: 450,
    modal: true,
    resizable: false,
    buttons: {
      'Change bug': function() {
        $(this).dialog('close');
        var index = $(this).attr('data-index');
        var bug = $(this).attr('data-bug');
        ViewerController.onChangeBug(parseInt(index), bug, $('#changeBug')[0].value);
      },
      'Cancel': function() {
        var cset = $(this).attr('data-cset');
        var bug = $(this).attr('data-bug');
        $(this).dialog('close');
        Viewer.addChangeButtonListener(cset, bug);
      }
    },
    open: function() {
      $('#changeBug')[0].value = '';
      $('#changeBug').on('keyup', function (e) {
        if (e.keyCode == 13 && $('#bugChangeForm').is(':visible')) {
          $(':button:contains("Change bug")').click();
          return false;
        }
      });
    }
  });

  $('#invalidBugMessage').dialog({
    autoOpen: false,
    modal: true,
    resizable: false,
    buttons: {
      'OK': function() {
        $(this).dialog('close');
      }
    },
  });

  $('#submissionMessage').dialog({
    autoOpen: false,
    modal: true,
    resizable: false,
    buttons: {
      'OK': function() {
        $(this).dialog('close');
      }
    },
    open: function() {
      var sent = $(this).attr('data-sent');
      var max = $(this).attr('data-max');
      $('#submissionText').empty();
      $('#submissionText').append(sent + ' of ' + max + ' bugs succesfully sent.');
    }
  });

  $('#invalidEmailMessage').dialog({
    autoOpen: false,
    modal: true,
    resizable: false,
    buttons: {
      'OK': function() {
        $(this).dialog('close');
      }
    },
  });
});

var LoadingOverlay = {
  showLoadingMessage: function lo_ShowLoadingMessage() {
    //$('#loadingOverlay').html('Please wait...');
    //$('#loadingOverlay').dialog('option', 'title', 'Loading');
    $('#loadingOverlay').dialog('open');
  },

  closeLoadingMessage: function lo_CloseLoadingMessage() {
    $('#loadingOverlay').dialog('close');
  }
}

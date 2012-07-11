"use strict";

$(document).ready(function() {
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
});

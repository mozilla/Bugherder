"use strict";

var FlagLoader = {

  init: function FL_init(cset, tree, loadCallback, errorCallback) {
    var self = this;
    $.ajax({
      url: 'php/getFlags.php?cset=' + cset + '&tree=' + tree,
      dataType: 'json',
      success: function FL_ajaxSuccessCallback(data) {
        self.parseData(data, loadCallback, errorCallback);
      },
      error: errorCallback
    });
  },


  parseData: function FL_parseData(data, loadCallback, errorCallback) {
    if ('error' in data)
      errorCallback(null, data['error']);
    loadCallback(data);
  }
};

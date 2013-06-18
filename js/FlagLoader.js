"use strict";

var FlagLoader = {

  init: function FL_init(cset, tree, loadCallback, errorCallback) {
    var self = this;
    // When running from the local filesystem use the production backend.
    var baseURL = (window.location.protocol == 'file:') ? Config.productionURL : '';
    $.ajax({
      url: baseURL + 'php/getFlags.php?cset=' + cset + '&tree=' + tree,
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

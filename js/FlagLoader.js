"use strict";

var FlagLoader = {

  init: function FL_init(cset, tree, loadCallback, errorCallback) {
    // The version for some repositories is a constant, since they're release branches.
    // We can infer their version from the repo name to avoid querying the repo.
    var esrVersion = /-esr(\d+)$/.exec(tree);
    if (esrVersion) {
      var esrName = 'esr';
      if (tree.indexOf('comm') != -1) {
        esrName = 'thunderbird_esr';
      }
      var flags = this.generateFlags(esrName + esrVersion[1]);
      loadCallback(flags);
      return;
    }
    if (tree.indexOf('mozilla-b2g') != -1) {
      // TODO: B2G repos use B2G version numbers, which are not yet supported.
      errorCallback(null, 'unknown tree');
      loadCallback({});
      return;
    }
    var productName = 'firefox';
    if (tree.indexOf('comm') != -1) {
      productName = 'thunderbird';
    }
    var self = this;
    // When running from the local filesystem use the production backend.
    var baseURL = (window.location.protocol == 'file:') ? Config.productionURL : '';
    $.ajax({
      url: baseURL + 'php/getFlags.php?cset=' + cset + '&tree=' + tree,
      dataType: 'json',
      success: function FL_ajaxSuccessCallback(data) {
        self.parseData(data, productName, loadCallback, errorCallback);
      },
      error: errorCallback
    });
  },

  parseData: function FL_parseData(data, productName, loadCallback, errorCallback) {
    if ('error' in data) {
      errorCallback(null, data['error']);
      loadCallback({});
      return;
    }
    var flags = this.generateFlags(productName + data['version']);
    loadCallback(flags);
  },

  generateFlags: function FL_generateFlags(flagSuffix) {
    return {'tracking': 'tracking_' + flagSuffix,
            'status': 'status_' + flagSuffix};
  }
};

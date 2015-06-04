"use strict";

var FlagLoader = {

  init: function FL_init(cset, tree, loadCallback, errorCallback) {
    // Bug 1159415: Short term tweak to set the firefox38.0.5 flags
    var thisDate = new Date();
    var betaDate = new Date(2015, 4, 4);
    var releaseDate = new Date(2015, 5, 22);
    if ((thisDate < betaDate && tree == 'mozilla-beta') ||
        (betaDate < thisDate && thisDate < releaseDate && tree == 'mozilla-release')) {
      var flags = this.generateFlags('firefox38_0_5');
      loadCallback(flags);
      return;
    }
    // The version for some repositories is a constant, since they're release branches.
    // We can infer their version from the repo name to avoid querying the repo.
    var esrVersion = /-esr(\d+)$/.exec(tree);
    if (esrVersion) {
      var esrName = 'firefox_esr';
      if (tree.indexOf('comm') != -1) {
        esrName = 'thunderbird_esr';
      }
      var flags = this.generateFlags(esrName + esrVersion[1]);
      loadCallback(flags);
      return;
    }
    if (tree.indexOf('mozilla-b2g') != -1) {
      // Hardcode some b2g release branch flags
      var flags;
      switch(tree) {
        case "mozilla-b2g32_v2_0":
          flags = this.generateFlags("b2g_2_0");
          break;
        case "mozilla-b2g32_v2_0m":
          flags = this.generateFlags("b2g_2_0m");
          break;
        case "mozilla-b2g34_v2_1":
          flags = this.generateFlags("b2g_2_1");
          break;
        case "mozilla-b2g34_v2_1s":
          flags = this.generateFlags("b2g_2_1_s");
          break;
        case "mozilla-b2g37_v2_2":
          flags = this.generateFlags("b2g_2_2");
          break;
        default:
          errorCallback(null, 'unknown tree');
          flags = {};
          return;
      }
      loadCallback(flags);
      return;
    }
    var treeInfo = Config.treeInfo[tree];
    var productName = 'firefox';
    var fileLocation = '/browser/config/version.txt';
    if (tree.indexOf('comm') != -1) {
      productName = 'thunderbird';
      fileLocation = '/mail/config/version.txt';
    }
    var self = this;
    $.ajax({
      url: Config.hgBaseURL + treeInfo.repo + '/raw-file/' + cset + fileLocation,
      dataType: 'text',
      success: function FL_ajaxSuccessCallback(data) {
        self.parseData(data, productName, loadCallback, errorCallback);
      },
      error: errorCallback
    });
  },

  parseData: function FL_parseData(data, productName, loadCallback, errorCallback) {
    // The version number is of form: "36.0a1", "35.0a2, "34.0" etc.
    var version = /^([1-9][\d]*)(?:\.[\d]+)?/.exec(data);
    if (!version) {
      errorCallback(null, 'Unable to parse version.txt');
      loadCallback({});
      return;
    }
    var flags = this.generateFlags(productName + version[1]);
    loadCallback(flags);
  },

  generateFlags: function FL_generateFlags(flagSuffix) {
    // B2G doesn't use tracking flags, only status
    if(flagSuffix.indexOf('b2g_') != -1) {
      return {'status': 'status_' + flagSuffix};
    } else {
      return {'tracking': 'tracking_' + flagSuffix,
              'status': 'status_' + flagSuffix};
    }
  }
};

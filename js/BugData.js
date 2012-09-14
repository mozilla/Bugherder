"use strict";

var BugData = {
  bugs: {},
  trackingFlag: null,

  load: function BD_load(bugs, loadCallback, errorCallback) {
    if (mcMerge.trackingFlag)
      this.trackingFlag = 'cf_' + mcMerge.trackingFlag;
    if (mcMerge.statusFlag)
      this.statusFlag = 'cf_' + mcMerge.statusFlag;

    bugs = {id : bugs};

    var self = this;
    var callback  = function BD_LoadCallback(errmsg, data) {
      if (errmsg)
        errorCallback(errmsg);
      else
        self.parseData(data, loadCallback);
    };

    var bugzilla = bz.createClient();
    bugzilla.searchBugs(bugs, callback);
  },


  makeBug: function BD_makeBug(bugObj) {
    var bug = {};
    bug.resolution = UI.htmlEncode(bugObj.resolution);
    bug.status = UI.htmlEncode(bugObj.status);
    bug.whiteboard = UI.htmlEncode(bugObj.whiteboard);
    bug.keywords = bugObj.keywords;
    bug.milestone = UI.htmlEncode(bugObj.target_milestone);
    bug.summary = UI.htmlEncode(bugObj.summary);
    bug.canResolve = !(bug.status == 'RESOLVED' || bug.status == 'VERIFIED');
    bug.id = bugObj.id;
    if (typeof bug.id == 'string')
      bug.id = UI.htmlEncode(bug.id);
    bug.product = bugObj.product;
    bug.canReopen = bug.resolution == 'FIXED';
    bug.isTracked = false;
    if (this.trackingFlag && bugObj[this.trackingFlag] == '+')
      bug.isTracked = true;
    bug.statusFlag = '---';
    if (this.statusFlag)
      bug.statusFlag = bugObj[this.statusFlag];
    this.bugs[bugObj.id] = bug;
  },


  parseData: function BD_parseData(data, loadCallback) {
    data.forEach(this.makeBug, this);
    loadCallback();
  }
};

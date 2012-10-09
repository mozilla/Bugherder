"use strict";

var BugData = {
  bugs: {},
  trackingFlag: null,
  statusFlag: null,
  fields: 'id,resolution,status,whiteboard,keywords,target_milestone,summary,product,component,flags,assigned_to',

  load: function BD_load(bugs, loadCallback, errorCallback) {
    if (mcMerge.trackingFlag)
      this.trackingFlag = 'cf_' + mcMerge.trackingFlag;
    if (mcMerge.statusFlag)
      this.statusFlag = 'cf_' + mcMerge.statusFlag;

    var includeFields = this.fields;
    if (this.trackingFlag)
      includeFields += ',' + this.trackingFlag;
    if (this.statusFlag)
      includeFields += ',' + this.statusFlag;

    bugs = {id : bugs, include_fields: includeFields};

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

    if (bugObj.resolution)
      bug.resolution = UI.htmlEncode(bugObj.resolution);
    else
      bug.resolution = '';
    
    if (bugObj.whiteboard)
      bug.whiteboard = bugObj.whiteboard;
    else
      bug.whiteboard = '';

    if (bugObj.keywords)
      bug.keywords = bugObj.keywords;
    else
      bug.keywords = '';

    // The next five should always be present
    bug.status = UI.htmlEncode(bugObj.status);
    bug.milestone = UI.htmlEncode(bugObj.target_milestone);
    bug.summary = UI.htmlEncode(bugObj.summary);
    bug.product = bugObj.product;
    bug.id = bugObj.id;
    if (typeof bug.id == 'string')
      bug.id = UI.htmlEncode(bug.id);


    bug.canResolve = !(bug.status == 'RESOLVED' || bug.status == 'VERIFIED');
    bug.canReopen = bug.resolution == 'FIXED';

    bug.isTracked = false;
    if (this.trackingFlag && bugObj[this.trackingFlag] == '+')
      bug.isTracked = true;

    bug.statusFlag = '---';
    if (this.statusFlag)
      bug.statusFlag = bugObj[this.statusFlag];

    bug.isUnassigned = bugObj.assigned_to.name == 'nobody';

    bug.intestsuite = ' ';
    bug.testsuiteFlagID = -1;
    bug.canSetTestsuite = ConfigurationData.products[bug.product][bugObj.component];
    if (bug.canSetTestsuite && 'flags' in bugObj && bugObj.flags) {
      for (var i = 0; i < bugObj.flags.length; i++) {
        var f = bugObj.flags[i];
        if (f.name == 'in-testsuite' && f.type_id == ConfigurationData.testsuiteFlag) {
          bug.intestsuite = f.status; 
          bug.testsuiteFlagID = f.id;
          break;
        }
      }
    }

    this.bugs[bugObj.id] = bug;
  },


  parseData: function BD_parseData(data, loadCallback) {
    data.forEach(this.makeBug, this);
    loadCallback();
  }
};

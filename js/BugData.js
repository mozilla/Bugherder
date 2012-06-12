"use strict";

var BugData = {
  bugs: {},

  load: function BD_load(bugs, loadCallback, errorCallback) {
    bugs = {id : bugs};

    var self = this;
    var callback  = function(errmsg, data) {
      if (errmsg)
        errorCallback(errmsg);
      else
        self.parseData(data, loadCallback);
    };

    var bugzilla = bz.createClient();
    bugzilla.searchBugs(bugs, callback);
  },


  // Encode text for HTML insertion per OWASP guidelines
  htmlEncode: function BD_makeHTMLencode(desc) {
    desc = desc.replace('&', '&amp;', 'g');
    desc = desc.replace('<', '&lt;', 'g');
    desc = desc.replace('>', '&gt;', 'g');
    desc = desc.replace('"', '&quot;', 'g');
    desc = desc.replace("'", '&#x27;', 'g');
    desc = desc.replace('/', '&#x2f;', 'g');
    return desc;
  },


  makeBug: function BD_makeBug(bugObj) {
    var bug = {};
    bug.resolution = this.htmlEncode(bugObj.resolution);
    bug.status = this.htmlEncode(bugObj.status);
    bug.whiteboard = this.htmlEncode(bugObj.whiteboard);
    bug.keywords = bugObj.keywords;
    bug.milestone = this.htmlEncode(bugObj.target_milestone);
    bug.summary = this.htmlEncode(bugObj.summary);
    bug.canResolve = !(bug.status == 'RESOLVED' || bug.status == 'VERIFIED');
    bug.id = bugObj.id;
    if (typeof bug.id == 'string')
      bug.id = this.htmlEncode(bug.id);
    bug.product = bugObj.product;
    this.bugs[bugObj.id] = bug;
  },


  parseData: function BD_parseData(data, loadCallback) {
    data.forEach(this.makeBug, this);
    loadCallback();
  }
};

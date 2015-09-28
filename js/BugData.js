"use strict";

var BugData = {
  bugs: {},
  productsArray: [],
  assignees: {},
  trackingFlag: null,
  statusFlag: null,
  fields: 'id,resolution,status,whiteboard,keywords,target_milestone,summary,product,component,flags,assigned_to',
  notYetLoaded: [],
  loadCallback: null,
  errorCallback: null,
  checkComments: false,

  load: function BD_load(bugs, checkComments, loadCallback, errorCallback) {
    this.notYetLoaded = bugs;
    this.loadCallback = loadCallback;
    this.errorCallback = errorCallback;
    this.checkComments = checkComments;
    this.loadMore();    
  },


  loadMore: function BD_loadMore() {
    var batch = [];
    var limit = 500; // to avoid URI too long errors from BZAPI
    if (this.notYetLoaded.length < limit)
      limit = this.notYetLoaded.length;
    for (var i = 0; i < limit; i++)
      batch.push(this.notYetLoaded.pop());
    this._realLoad(batch.join(','));
  },


  _realLoad: function BD_realLoad(bugs) {
    if (bugherder.trackingFlag)
      this.trackingFlag = 'cf_' + bugherder.trackingFlag;
    if (bugherder.statusFlag)
      this.statusFlag = 'cf_' + bugherder.statusFlag;

    var includeFields = this.fields;
    if (this.checkComments)
      includeFields += ',comments';
    if (this.trackingFlag)
      includeFields += ',' + this.trackingFlag;
    if (this.statusFlag)
      includeFields += ',' + this.statusFlag;

    // Calculate an appropriate timeout for the amount of bugs being loaded
    var timeout = (Math.floor(bugs.length / 100) + 1) * 30000;
    bugs = {id : bugs, include_fields: includeFields};

    var self = this;
    var callback  = function BD_LoadCallback(errmsg, data) {
      if (errmsg)
        self.errorCallback(errmsg);
      else
        self.parseData(data);
    };

    var bugzilla = bz.createClient({timeout: timeout});
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
      bug.keywords = [];

    // The next five should always be present
    bug.status = UI.htmlEncode(bugObj.status);
    bug.milestone = UI.htmlEncode(bugObj.target_milestone);
    bug.summary = UI.htmlEncode(bugObj.summary);
    bug.product = bugObj.product;
    bug.component = bugObj.component;
    bug.id = bugObj.id;
    if (typeof bug.id == 'string')
      bug.id = UI.htmlEncode(bug.id);

    if (this.checkComments)
      bug.comments = bugObj.comments;

    bug.canResolve = !(bug.status == 'RESOLVED' || bug.status == 'VERIFIED');
    bug.canReopen = bug.resolution == 'FIXED';

    // The preferred way to prevent bug closure is through the keyword, however
    // test for the previous method of whiteboard annotation
    bug.leaveOpen = bug.keywords.indexOf('leave-open') !== -1 ||
                    Config.leaveOpenRE.test(bug.whiteboard);

    bug.isTracked = false;
    if (this.trackingFlag && bugObj[this.trackingFlag] == '+')
      bug.isTracked = true;

    bug.statusFlag = '---';
    if (this.statusFlag)
      bug.statusFlag = bugObj[this.statusFlag];

    bug.assignee = bugObj.assigned_to;

    bug.intestsuite = ' ';
    bug.testsuiteFlagID = -1;
    bug.canSetTestsuite = ConfigurationData.hasTestsuiteFlag[bug.product][bugObj.component];
    if (bug.canSetTestsuite && 'flags' in bugObj && bugObj.flags) {
      for (var i = 0; i < bugObj.flags.length; i++) {
        var f = bugObj.flags[i];
        if (f.name == 'in-testsuite' && f.type_id == ConfigurationData.testsuiteFlagID) {
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
    this.getDefaultAssignees(data);
    if (this.notYetLoaded.length == 0)
      this.loadCallback();
    else
      this.loadMore();
  },

  /*
   * Get default assignees for all products in this push from the API.
   * We have to get this separate from the bugs query because API doesn't
   * expose that information from the bugs endpoint.
   */
  getDefaultAssignees: function BD_getDefaultAssignees(data) {
    data.forEach(this.parseProducts, this);
    var productQueryString = "/product?names=" + this.productsArray.join("&names=") +
                             "include_fields=name,components.name,components.default_assigned_to";

    var callback  = function BD_AssigneeCallback(errmsg, data) {
      if (errmsg) {
        self.errorCallback(errmsg);
      } else {
        data.forEach(function(prod) {
          var prodName = prod.name;
          BugData.assignees[prodName] = {};
          data[prod].components.forEach(function(component) {
            BugData.assignees[prodName][component.name] = component.default_assigned_to;
          });
        });
        for(var bug in BugData.bugs) {
          BugData.recheckAssignee(BugData.bugs[bug]);
        }
      }
    };

    var bugzilla = bz.createClient({timeout: 30000});
    bugzilla.APIRequest(productQueryString, "GET", callback, "products");
  },

  /*
   * Create an array of all unique products in this push
   */
  parseProducts: function BD_parseProducts(bugObj) {
    if (!(bugObj.product in this.assignees)) {
      this.productsArray.push(bugObj.product);
    }
  },

  /*
   * Now that we have the default assignee values, compare against the
   * current assignee, and store that for use later.
   */
  recheckAssignee: function BD_recheckAssignee(bug) {
    if (this.assignees[bug.product][bug.component] == bug.assignee) {
      bug.isUnassigned = true;
    } else {
      bug.isUnassigned = false;
    }
  }
};

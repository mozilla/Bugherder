"use strict";

var mcMerge = {
  debug: false,
  expand: false,
  remap: false,
  tree: null,

  stageTypes: [{name: 'foundBackouts'},
    {name: 'notFoundBackouts'},
    {name: 'merges'},
    {name: 'others'},
    {name: 'fixes'}
  ],


  init: function mcM_Init() {
    var self = this;
    $(document).ready(function onDocReady() {
      if (Config.inMaintenanceMode) {
        $('#errorText').text('mcMerge is down for maintenance!');
        UI.show('errors');
        return;
      }

      if (Config.supportsHistory) {
        $(window).on('popstate', {mcMerge: self}, function mcM_InitPopstate(e) {
         // Chrome!
         if (!e.state)
           return;

         self.parseQuery(e);
        });
      }
      self.parseQuery();
    });

    $(window).unload(function mcM_InitCleanUp() {
      delete Step.privilegedLoad;
      delete Step.privilegedUpdate;
      delete Step.username;
    });
  },


  // Show the initial cset form, optionally with an error, and
  // setup a listener to validate input
  acquireChangeset: function mcM_showForm(errorText) {
    delete this.cset;
    delete this.loading;

    var self = this;

    document.title = 'm-cMerge';

    var formListener = function mcM_acquireListener(e) {
      self.validateForm(e);
    };

    if (!errorText)
      UI.showForm(formListener);
    else
      UI.showFormWithError(formListener, errorText);
  },


  // Display an appropriate error, then display the cset form
  errorPage: function mcM_errorPage(params) {
    var errorType = params['error'];
    var errorText = 'Unknown error';
    var cset = 'cset' in params ? ' ' + UI.htmlEncode(params['cset']) : '';
    var treeName = 'tree' in params ? ' ' + UI.htmlEncode(params['tree']) : '';

    var dataType = 'pushlog';
    if (this.loading == 'bz')
      dataType = 'bugzilla';
    if (this.loading == 'version')
      dataType = 'target milestone';

    if (errorType == 'invalid')
      errorText = 'You entered an invalid changeset ID: IDs should either be 12-40 hexadecimal characters, or "tip"';

    if (errorType == 'fetch')
      errorText = 'Unable to fetch ' + dataType + ' data for changeset' + cset + '.';

    if (errorType == 'timeout')
      errorText = 'Request timed out when trying to fetch ' + dataType + ' data for changeset' + cset + '.';

    if (errorType == 'buglist')
      errorText = 'No bugs found for changeset' + cset + '.';

    if (errorType == 'bugs')
      errorText = 'Unable to load bugzilla data for changeset' + cset + '.';

    if (errorType == 'version')
      errorText = 'Unable to load target milestone possibilities for changeset' + cset + '.';

    if (errorType == 'treename')
      errorText = 'Unknown repository' + treeName + '.';

    this.acquireChangeset(errorText);
  },


  ajaxError: function mcM_ajaxError(response, textStatus, errorThrown, cset) {
    // Ideally, I would use this to provide meaningful error text, if eg cset doesn't exist on m-c.
    // However, jQuery seems to discard the HTTP 500 error that is returned (jqXHR.status gives 0)
    // so, we'll need to fallback to generic text
    if (!cset && this.cset)
      cset = this.cset;

    if (textStatus == 'timeout')
      this.go('error=timeout&cset='+cset, false);
    else
      this.go('error=fetch&cset='+cset, false);
  },


  // Parse the first merge cset description to try and find out what repo was merged with m-c
  findSourceRepo: function mcM_findSourceRepo() {
    var fromRepo = '';
    var mergeDesc = '';
    if (PushData.merges[0])
      mergeDesc = PushData.allPushes[PushData.merges[0]].desc;

    if (!mergeDesc)
      return '';

    var reArray = new Array();

    // Create the various regular expressions to match repo merges
    var synonyms = Config.mcSynonyms;
    for (var i = 0; i < synonyms.length; i++) {
      var re = new RegExp(Config.repoMergeRE + synonyms[i], 'ig');
      reArray.push(re);
      re = new RegExp(synonyms[i] + Config.repoMergeRE, 'ig');
      reArray.push(re);
    }

    var reResult = null;
    for (i = 0; i < reArray.length; i++) {
      reResult = reArray[i].exec(mergeDesc);
      if (reResult)
        break;
    }

    if (!reResult)
      return '';

    // We've found text declaring that it's a merge to m-c, can we find another repo name?
    var otherRepo = '';
    for (i in Config.treeInfo) {
      synonyms = Config.treeInfo[i].synonyms;
      for (var j = 0; j < synonyms.length; j++) {
        if (mergeDesc.indexOf(synonyms[j]) != -1) {
          otherRepo = i;
          break;
        }
      }
      if (otherRepo)
        break;
    }

    if (otherRepo)
      return otherRepo;

    return '';
  },


  // Callback following load of bug data from Bugzilla. Providing there's no errors, it's time
  // to display the UI
  onBugLoad: function mcM_onBugLoad(bugs) {
    if (!BugData.bugs) {
      this.go('error=bugs&cset='+this.cset, false);
      return;
    }

    this.updateUI();
  },


  // Callback following load of version options from Bugzilla. Checks for errors, then kicks off
  // bug loading
  onbzVersionLoad: function mcM_onBZVersionLoad() {
    if (!MilestoneData.milestones) {
      this.go('error=version&cset='+this.cset, false);
      return;
    }

    // Don't bother loading bugs for the debug UI
    if (this.debug) {
      this.updateUI();
      return;
    }

    this.loadBugs();
  },


  // Callback following load of pushlog data. Kicks off loading of current version from m-c
  onPushlogLoad: function mcM_onPushlogLoad(pushData, cset) {
    UI.hideLoadingMessage();

    if (!PushData.allPushes || PushData.allPushes.length == 0) {
      this.go('error=fetch&cset='+cset, false);
      return;
    }

    if (!this.tree)
      UI.sourceRepo = this.findSourceRepo();

    // Stash the changeset requested for future error messages
    this.cset = cset;

    this.loadVersionFromBZ();
  },


  // Build the list of bugs we're interested in, kick off the async load
  loadBugs: function mcM_loadBugs() {
    if (!PushData.allPushes || !PushData.fixes)
      return;

    this.loading = 'bz';
    UI.showLoadingMessage('Loading bugzilla data...');

    // Build list of bugs to load
    var bugs = PushData.fixes.map(this.getBug, this).join(',');
    if (bugs && PushData.backedOut.length > 0)
      bugs += ',';
    bugs += PushData.backedOut.map(this.getBug, this).join(',');


    // There were no bug numbers found? Might happen when called with a
    // non-merge "no bug" changeset
    if (!bugs) {
      this.updateUI();
      return;
    }

    var self = this;
    var loadCallback = function mcM_loadBugsLoadCallback() {
     self.onBugLoad();
    };

    var errorCallback = function mcM_loadBugsErrorCallback(jqResponse, textStatus, errorThrown) {
      self.ajaxError(jqResponse, textStatus, errorThrown);
    };

    BugData.load(bugs, loadCallback, errorCallback);
  },


  // Load options for options menu from Bugzilla config
  loadVersionFromBZ: function mcM_loadVersionFromBZ() {
    this.loading = 'version';
    UI.showLoadingMessage('Loading milestone possibilities...');
    var self = this;

    var versionsCallback = function mcM_loadVersionLoadCallback() {
      self.onbzVersionLoad();
    };

    var errorCallback = function mcM_loadVersionErrorCallback(jqResponse, textStatus, errorThrown) {
      self.ajaxError(jqResponse, textStatus, errorThrown);
    };

    MilestoneData.init(versionsCallback, errorCallback);
  },


  // Load the pushlog for the given cset
  loadChangeset: function mcM_loadChangeset(cset) {
    if (!this.validateChangeset(cset)) {
      this.go('error=invalid', false);
      return;
    }

    document.title = 'm-cMerge (changeset: ' + cset + ')';
    this.loading = 'cset';
    UI.showLoadingMessage('Loading pushlog data...');

    var self = this;
    var loadCallback = function mcM_loadChangsetLoadCallback(pushData) {
     self.onPushlogLoad(cset);
    };

    var errorCallback = function mcM_loadChangesetErrorCallback(jqResponse, textStatus, errorThrown) {
      self.ajaxError(jqResponse, textStatus, errorThrown, cset);
    };

    PushData.init(cset, loadCallback, errorCallback);
  },


  getBug: function mcM_getBug(push) {
    return PushData.allPushes[push].bug;
  },


  showDebugUI: function mcM_debugUI() {
    DebugUI.displayPushes();
  },


  updateUI: function mcM_updateUI() {
    UI.hideAll();
    UI.displayDetail();

    if (this.debug) {
      this.showDebugUI();
      return;
    }

    this.remaps = {items: 0};

    if (this.remap)
      Remapper.show();
    else
      this.showSteps();
  },


  onRemap: function mcM_onRemap(remaps) {
    this.remaps = remaps;
    this.showSteps();
  },


  showSteps: function mcM_showSteps() {
    Step.remaps = this.remaps;
    Viewer.expand = this.expand;
    ViewerController.init(this.remap);

    // How many stages do we have?
    for (var i = 0; i < this.stageTypes.length; i++) {
      var stageName = this.stageTypes[i].name;

      if (PushData[stageName].length == 0)
        continue;

      ViewerController.addStep(stageName, stageName == 'foundBackouts');
    }

    ViewerController.viewStep(0);
  },


  validateChangeset: function mcM_validateChangeset(input) {
    return Config.csetInputRE.test(input);
  },


  // Verify form content is valid, and try to load it if so
  validateForm: function mcM_validateForm(e) {
    e.preventDefault();
    var input = $('#changeset').attr('value');
    input = input.trim();

    var reres = Config.hgRevRE.exec(input);
    if (reres)
      input = input.substring(reres[0].length);
    else {
      reres = Config.hgPushlogRE.exec(input);
      if (reres)
        input = input.substring(reres[0].length);
    }

    if (this.validateChangeset(input)) {
      this.go('cset='+input, false);
      return;
    } else {
      var tree = null;

      for (var treeName in Config.treeInfo) {
        reres = Config.treeInfo[treeName].hgRevRE.exec(input);
        if (reres) {
          input = input.substring(reres[0].length);
          tree = treeName;
          break;
        } else {
          reres = Config.treeInfo[treeName].hgPushlogRE.exec(input);
          if (reres) {
            input = input.substring(reres[0].length);
            tree = treeName;
            break;
          }
        }
      }

      if (tree && this.validateChangeset(input)) {
        this.go('cset='+input + '&tree=' + tree, false);
        return;
      }
    }

    // Don't fill history stack with multiple error pages
    var replace = document.location.href.indexOf('error') != -1;
    this.go('error=invalid', replace);
  },


  // Parse URL to display correct content
  parseQuery: function mcM_parseQuery(event) {
    var self = null;
    if (!event)
      self = this;
    else
      self = event.data.mcMerge;

    var query = document.location.search;
    if (query) {
      query = query.substring(1);
      var params = query.split('&');
      var paramsObj = {}
      for (var x in params) {
        var p = params[x].split('=');
        paramsObj[p[0]] = p[1];
      }
      if ('debug' in paramsObj)
        this.debug = (paramsObj['debug'] == '1');
      if ('expand' in paramsObj)
        this.expand = (paramsObj['expand'] == '1');
      if ('remap' in paramsObj)
        this.remap = (paramsObj['remap'] == '1');

      if ('error' in paramsObj)
        return self.errorPage(paramsObj);

      if ('cset' in paramsObj) {
        var cset = paramsObj['cset'];

        if ('tree' in paramsObj) {
          var treeName = paramsObj['tree'];
          if (!(treeName in Config.treeInfo) && treeName != 'mozilla-central') {
            var replace = document.location.href.indexOf('error') != -1;
            this.go('error=treename&tree=' + treeName, replace);
            return;
          }
          if (treeName == 'mozilla-central') {
            this.go('cset=' + cset, true);
            return;
          }

          this.tree = treeName;
          Config.hgURL = Config.treeInfo[treeName].hgURL;
          Config.hgRevURL = Config.treeInfo[treeName].hgRevURL;
          Config.hgPushlogURL = Config.treeInfo[treeName].hgPushlogURL;
          Config.treeName = treeName;
        } else {
          this.tree = null;
          Config.hgURL = Config.hgMCURL;
          Config.hgRevURL = Config.hgMCRevURL;
          Config.hgPushlogURL = Config.hgMCPushlogURL;
          Config.treeName = 'mozilla-central';
        }

        return self.loadChangeset(cset);
      }
    }
    return self.acquireChangeset();
  },


  // Push a new URL onto history
  go: function mcM_go(query, replace) {
    var newURL = document.location.href.split('?')[0];
    if (query)
      newURL = newURL + '?' + query;

    var maintained = [];

    // Maintain debug state across page load
    if (this.debug)
      maintained.push('debug=1');

    // Maintain expand state across page load
    if (this.expand)
      maintained.push('expand=1');

    // Maintain remap state across page load
    if (this.remap)
      maintained.push('remap=1');

    var maintainedQuery = maintained.join('&');
    if (!query && maintainedQuery.length > 0)
      newURL += '?';
    else if (query && maintainedQuery.length > 0)
      newURL += '&';
    newURL += maintainedQuery;

    if (Config.supportsHistory) {
      if (replace)
        history.replaceState(null, null, newURL);
      else
        history.pushState(null, null, newURL);
      this.parseQuery();
    } else {
       document.location.href = newURL;
    }
  }
};

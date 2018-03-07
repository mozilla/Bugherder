"use strict";

var ConfigurationData = {
  milestones: {},
  hasTestsuiteFlag: {},
  testsuiteFlagID: -1,

  // useNext represents products where I'm reasonably
  // confident that the correct milestone is --- + 1
  useNext: ['Add-on SDK',
            'Android Background Services',
            'Core',
            'Fennec',
            'Firefox',
            'Firefox for Android',
            'Firefox for Metro',
            'Firefox Health Report',
            'Hello (Loop)',
            'MailNews Core',
            'Mozilla Localizations',
            'Mozilla Services',
            'Other Applications',
            'SeaMonkey',
            'Taskcluster',
            'Testing',
            'Thunderbird',
            'Toolkit'],

  init: function CD_init(loadCallback, errorCallback) {
    var self = this;
    var callback  = function CD_initCallback(errmsg, data) {
      if (errmsg)
        errorCallback(errmsg);
      else
        self.parseData(data, loadCallback);
    };

    var bugzilla = bz.createClient({timeout: 60000});
    bugzilla.getConfiguration(callback);
  },


  parseData: function CD_parseData(data, loadCallback) {
    if (!('product' in data)) {
        loadCallback();
        return;
    }
    // Find the flag number for in-testsuite
    if ('flag_type' in data) {
      for (var flagNumber in data['flag_type']) {
        if (data['flag_type'][flagNumber].name == 'in-testsuite') {
          this.testsuiteFlagID = parseInt(flagNumber);
          break;
        }
      }
    }
    var products = data.product;
    var productMilestones = {}
    for (var product in products) {
      // Parse Milestones
      var active_milestones = products[product].target_milestone_detail.filter(function (milestone) {
        return milestone.is_active;
      }).map(function (milestone) {
        return milestone.name;
      });
      productMilestones[product] = {}
      productMilestones[product].values = active_milestones.map(UI.htmlEncode);
      var dashIndex = active_milestones.indexOf('---');
      if (dashIndex != -1) {
        if (dashIndex + 1 < active_milestones.length && this.useNext.indexOf(product) != -1) {
          productMilestones[product].defaultIndex = dashIndex + 1;
        } else if (active_milestones.indexOf('Firefox ' + bugherder.milestone) !== -1) {
          productMilestones[product].defaultIndex = active_milestones.indexOf('Firefox ' + bugherder.milestone);
        } else if (active_milestones.indexOf('mozilla' + bugherder.milestone) !== -1) {
          productMilestones[product].defaultIndex = active_milestones.indexOf('mozilla' + bugherder.milestone);
        } else {
          productMilestones[product].defaultIndex = dashIndex;
        }
      } else {
        productMilestones[product].defaultIndex = 0;
      }

      // Find which products/components can have in-testsuite set
      if (this.testsuiteFlagID != -1) {
        this.hasTestsuiteFlag[product] = {};
        for (var component in products[product].component) {
          var hasTestsuite = products[product].component[component].flag_type.indexOf(this.testsuiteFlagID) != -1;
          this.hasTestsuiteFlag[product][component] = hasTestsuite;
        }
      }
    }
    this.milestones = productMilestones;
    loadCallback();
  }
};

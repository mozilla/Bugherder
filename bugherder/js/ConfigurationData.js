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

  dateMilestones: [["FxOS-S1 (26Jun)", new Date(2015, 5, 26)],
                   ["FxOS-S2 (10Jul)", new Date(2015, 6, 10)],
                   ["FxOS-S3 (24Jul)", new Date(2015, 6, 24)],
                   ["FxOS-S4 (07Aug)", new Date(2015, 7, 7)],
                   ["FxOS-S5 (21Aug)", new Date(2015, 7, 21)],
                   ["FxOS-S6 (04Sep)", new Date(2015, 8, 4)],
                   ["FxOS-S7 (18Sep)", new Date(2015, 8, 18)],
                   ["FxOS-S8 (02Oct)", new Date(2015, 9, 2)],
                   ["FxOS-S9 (16Oct)", new Date(2015, 9, 16)],
                   ["FxOS-S10 (30Oct)", new Date(2015, 9, 30)],
                   ["FxOS-S11 (13Nov)", new Date(2015, 10, 13)],
                   ["2.6 S1 - 11/20", new Date(2015, 10, 20)],
                   ["2.6 S2 - 12/4", new Date(2015, 11, 4)],
                   ["2.6 S3 - 12/18", new Date(2015, 11, 18)],
                   ["2.6 S4 - 1/1", new Date(2016, 0, 1)],
                   ["2.6 S5 - 1/15", new Date(2016, 0, 15)],
                   ["2.6 S6 - 1/29", new Date(2016, 0, 29)],
                   ["2.6 S7 - 2/12", new Date(2016, 1, 12)],
                   ["2.6 S8 - 2/26", new Date(2016, 1, 26)],
                   ["2.6 S9 - 3/11", new Date(2016, 2, 11)],
                   ["2.6 S10 - 3/25", new Date(2016, 2, 25)],
                   ["2.6 S11 - 4/8", new Date(2016, 3, 8)],
                   ["2.6 S12 - 4/22", new Date(2016, 3, 22)],
                   ["2.6 S13 - 5/6", new Date(2016, 4, 6)],
                   ["2.6 S14 - 5/20", new Date(2016, 4, 20)],
                   ["2.6 S15 - 5/27", new Date(2016, 4, 27)]],


  init: function CD_init(loadCallback, errorCallback) {
    var self = this;
    var callback  = function CD_initCallback(errmsg, data) {
      if (errmsg)
        errorCallback(errmsg);
      else
        self.parseData(data, loadCallback);
    };

    var bugzilla = bz.createClient({timeout: 30000});
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
        } else if (product == "Firefox OS") {
          // B2G target milestones are date-based, handle these specially.
          productMilestones[product].defaultIndex = productMilestones[product].values.indexOf(this.getDateMilestone());
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
  },

  getDateMilestone: function CD_getDateMilestone(date) {
    if (!date) {
      date = Date.now();
    }
    var milestone;
    for (var i = 1; i < this.dateMilestones.length; i++) {
      if (date > this.dateMilestones[i-1][1] && date <= this.dateMilestones[i][1]) {
        milestone = this.dateMilestones[i][0];
      }
    }
    return milestone;
  }
};

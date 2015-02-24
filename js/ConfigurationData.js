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
            'Loop',
            'MailNews Core',
            'Mozilla Localizations',
            'Mozilla Services',
            'Other Applications',
            'SeaMonkey',
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

    var bugzilla = bz.createClient({timeout: 30000});
    bugzilla.getConfiguration(callback);
  },


  parseData: function CD_parseData(data, loadCallback) {
    if (!('product' in data)) {
        loadCallback();
        return;
    }
    var products = data.product;
    // Parse Milestones 
    var productMilestones = {}
    for (var product in products) {
      var values = products[product].target_milestone;
      productMilestones[product] = {}
      productMilestones[product].values = values.map(UI.htmlEncode);
      var dashIndex = values.indexOf('---');
      if (dashIndex != -1) {
        if (dashIndex + 1 < values.length && this.useNext.indexOf(product) != -1)
          productMilestones[product].defaultIndex = dashIndex + 1;
        else
          productMilestones[product].defaultIndex = dashIndex;
      } else
        productMilestones[product].defaultIndex = 0;
      }
    this.milestones = productMilestones;

    // Find the flag number for in-testsuite 
    if ('flag_type' in data) {
      for (var flagNumber in data['flag_type']) {
        if (data['flag_type'][flagNumber].name == 'in-testsuite') {
          this.testsuiteFlagID = parseInt(flagNumber);
          break;
        }
      }
    }

    // Find which products/components can have intestsuite set
    if (this.testsuiteFlagID != -1) {
      for (var product in products) {
        this.hasTestsuiteFlag[product] = {};
        for (var component in products[product].component) {
          var hasTestsuite = products[product].component[component].flag_type.indexOf(this.testsuiteFlagID) != -1;
          this.hasTestsuiteFlag[product][component] = hasTestsuite;
        }
      }
    }

    loadCallback();
  }
};

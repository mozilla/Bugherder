"use strict";

var MilestoneData = {
  milestones: {},

  // useNext represents products where I'm reasonably
  // confident that the correct milestone is --- + 1
  useNext: ['Core',
            'Fennec',
            'Firefox for Android',
            'Firefox',
            'MailNews Core',
            'Mozilla Localizations',
            'Mozilla Services',
            'Other Applications',
            'SeaMonkey',
            'Testing',
            'Thunderbird',
            'Toolkit'],


  init: function MD_init(loadCallback, errorCallback) {
    var self = this;
    var callback  = function MD_initCallback(errmsg, data) {
      if (errmsg)
        errorCallback(errmsg);
      else
        self.parseData(data, loadCallback);
    };

    var bugzilla = bz.createClient();
    bugzilla.getConfiguration(callback);
  },


  parseData: function MD_parseData(data, loadCallback) {
    var productMilestones = {}
    if ('product' in data) {
      for (var product in data['product']) {
        var values = data.product[product].target_milestone;
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
    }
    this.milestones = productMilestones;
    loadCallback();
  }
};

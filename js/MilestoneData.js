"use strict";

var MilestoneData = {
  milestones: {},

  // useNext represents products that I'm reasonably
  // confident that the correct milestone is --- + 1
  useNext: ['Core',
            'Fennec',
            'Fennec Native',
            'Firefox',
            'MailNews Core',
            'Mozilla Localizations',
            'Mozilla Services',
            'Other Applications',
            'SeaMonkey',
            'Testing',
            'Thunderbird',
            'Toolkit'],


  htmlEncode: function MD_HTMLencode(desc) {
    desc = desc.replace('&', '&amp;', 'g');
    desc = desc.replace('<', '&lt;', 'g');
    desc = desc.replace('>', '&gt;', 'g');
    desc = desc.replace('"', '&quot;', 'g');
    desc = desc.replace("'", '&#x27;', 'g');
    desc = desc.replace('/', '&#x2f;', 'g');
    return desc;
  },


  init: function MD_init(loadCallback, errorCallback) {
    var self = this;
    var callback  = function(errmsg, data) {
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
        productMilestones[product].values = values.map(this.htmlEncode);
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

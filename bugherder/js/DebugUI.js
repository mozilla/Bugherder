var DebugUI = {
  makePushHTML: function UI_makePushHTML(index) {
    var push = PushData.allPushes[index];
    var html = '<div class="changeset">';
    html += '<div class="grid-2">';
    html += UI.linkifyChangeset(push.cset) + "</div>";
    html += '<div class="grid-12">' + UI.linkifyDescription(push.desc);
    html  += ' (Bug ' + UI.linkifyBug(push.bug) + ')';
    html += ' Index: ' + index;
    if (push.backedOut)
      html += ' backed out by ' + UI.linkifyChangeset(push.backedOut);
    html += "</div>";
    if ('affected' in push && push.affected) {
      html += '<div class="grid-12">Affected: ';
      for (var x in push.affected)
        html += push.affected[x] +", ";
      html += '</div>';
    }
    html += "</div>";
    return html;
  },


  makeSection: function DebugUI_makeSection(title, pushes, debug) {
    var html = '<h3>' + title;
    html += ' (' + pushes.length + ' changesets)';
    html += '</h3>';
    html += pushes.map(this.makePushHTML, this).join('');
    return html;
  },


  displayPushes: function DebugUI_displayPushes() {
    var types = ['fixes', 'backedOut', 'foundBackouts', 'notFoundBackouts', 'merges', 'others'];
    var headings = ['Fixed Bugs', 'Pushes Backed Out', 'Backouts', 'Backouts of things not in this merge',
                    'Merge Changesets', 'Other Changesets'];

    var pushHTML = types.map(function (val, i) {return this.makeSection(headings[i], PushData[val]);}, this).join('');
    $('#pushes').html(pushHTML);
    UI.show('pushes');
  }
}

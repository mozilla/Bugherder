"use strict";

var Config = {
  supportsHistory : !!(window.history && history.pushState),
  inMaintenanceMode : false,

  hgBaseURL: "https://hg.mozilla.org/",
  hgURL: "https://hg.mozilla.org/mozilla-central/",
  hgRevURL: "https://hg.mozilla.org/mozilla-central/rev/",
  hgPushlogURL: "https://hg.mozilla.org/mozilla-central/pushloghtml?changeset=",
  showBugURL: "https://bugzilla.mozilla.org/show_bug.cgi?id=",
  versionURL: "php/getVersion.php",

  // Here be dragons
  versionRE: /^mozilla\d+$/i,
  csetInputRE: /^(tip|[\da-f]{12,40})$/i,
  csetIDRE: /\b([\da-f]{12,40})\b/ig,
  leaveOpenRE: /leave(?:-|\s+)open/i,
  bugNumRE: /\b(\d{4,7})\b/g,
  strictBugNumRE: /^(\d{4,7})$/,
  mergeRE: /\bmerg(ed?|ing)\b/i,
  backoutRE: /back(ing|ed)?\s*out/i,
  revertRE: /revert(ing)?/i,
  partialRevertRE: /(?:from|in)(?:\s+(?:rev(?:ision)?|c(?:hange)?set))?\s+([\da-f]{12,40})/i,
  partialTestRE: /test\s+for/i,
  revertRangeRE: /revert(?:ing)?\s+to(?:\s+(?:rev(?:ision)?|c(?:hange)set))?\s+([\da-f]{12,40})/i,
  csetRangeRE: /\b([\da-f]{12,40})\s*(?:to|:|-|through)\s*([\da-f]{12,40})/i,
  hgRevRE: /https?:\/\/hg.mozilla.org\/mozilla-central\/rev\//,
  hgRevFullRE: /https?:\/\/hg.mozilla.org\/mozilla-central\/rev\/[\da-f]{12}/ig,
  hgPushlogRE: /https?:\/\/hg.mozilla.org\/mozilla-central\/pushloghtml\?changeset=/,
  emailRE: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,   // I'm not looking for RFC 822 compliance here!

  // The many ways bug numbers are specified
  bugRE1: /b(?:ug)?=(\d{4,7})\b/i,                       // e.g. b=XXXXXX
  bugRE2: /^fix(?:es)?\s*(?:for\s*)?(\d{4,7})\b/i,                         // Fix is sometimes used as a synonym for bug
  bugRE3: /to\s+fix\s+bug\s+(\d{4,7})/i,
  bugRE4: /\((\d{4,7}), r=/i,                          // e.g. JS-team style (XXXXXX, r=foo)
  bugRE5: /but\s*(\d{4,7})/i,                          // The typo but XXXXXX happens quite often
  bugRE6: /\bb(?:u?g(?:zilla)?)?:?\s*#?(\d{4,7})\b/i,  // The catchall
  bugRE7: /^(\d{4,7})\b/i,                              // e.g. XXXXXX,

  repoMergeRE: "\\s+(&|and|with|<->|<>|-?->|(in|on)?to)\\s+",

  mcSynonyms: ["mozilla-central", "central", "m-c", "mc", "mozilla central"],

  treeInfo: {
    "Mozilla-Inbound": {
      repo: "integration/mozilla-inbound",
      synonyms: ["mozilla-inbound", "inbound", "m-i", "mi"]
    },
    "Jetpack": {
      repo: "projects/addon-sdk",
      synonyms: ["projects/addon-sdk", "addon-sdk"]
    },
    "Build-System": {
      repo: "projects/build-system",
      synonyms: ["build-system", "b-s", "bs"]
    },
    "Fx-Team": {
      repo: "integration/fx-team",
      synonyms: ["fx-team"]
    },
    "Graphics": {
      repo: "projects/graphics",
      synonyms: ["projects/graphics", "graphics"]
    },
    "Ionmonkey": {
      repo: "projects/ionmonkey",
      synonyms: ["projects/ionmonkey", "ionmonkey", "im"]
    },
    "Jaegermonkey": {
      repo: "projects/jaegermonkey",
      synonyms: ["projects/jaegermonkey", "jm"]
    },
    "Profiling": {
      repo: "projects/profiling",
      synonyms: ["profiling", "projects/profiling"]
    },
    "Services-Central": {
      repo: "services/services-central",
      synonyms: ["services-central", "s-c", "sc", "services/services-central"]
    },
    "UX": {
      repo: "projects/ux",
      synonyms: ["ux", "projects/ux"]
    },
    "Alder": {
      repo: "projects/alder",
      synonyms: ["alder", "projects/alder"]
    },
    "Ash": {
      repo: "projects/ash",
      synonyms: ["ash", "projects/ash"]
    },
    "Birch": {
      repo: "projects/birch",
      synonyms: ["projects/birch", "birch"]
    },
    "Cedar": {
      repo: "projects/cedar",
      synonyms: ["projects/cedar", "cedar"]
    },
    "Elm": {
      repo: "projects/elm",
      synonyms: ["projects/elm", "elm"]
    },
    "Holly": {
      repo: "projects/holly",
      synonyms: ["projects/holly", "holly"]
    },
    "Larch": {
      repo: "projects/larch",
      synonyms: ["projects/larch", "larch"]
    },
    "Maple": {
      repo: "projects/maple",
      synonyms: ["projects/maple", "maple"]
    },
    "Oak": {
      repo: "projects/oak",
      synonyms: ["projects/oak", "oak"]
    },
    "Pine": {
      repo: "projects/pine",
      synonyms: ["projects/pine", "pine"]
    },
    "Accessibility": {
      repo: "projects/accessibility",
      synonyms: ["projects/accessibility", "accessibility"]
    },
    "Devtools": {
      repo: "projects/devtools",
      synonyms: ["projects/devtools", "devtools"]
    },
    "Electrolysis": {
      repo: "projects/electrolysis",
      synonyms: ["projects/electrolysis", "electrolysis", "e10s"]
    },
    "Places": {
      repo: "projects/places",
      synonyms: ["projects/places", "places"]
    }
  }
};

Config.bugNumberREs = [Config.bugRE1, Config.bugRE2, Config.bugRE3,
                       Config.bugRE4, Config.bugRE5, Config.bugRE6, Config.bugRE7];

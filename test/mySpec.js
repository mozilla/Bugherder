console.log("Starting mySpec.js tests");

describe("A Hello World suite", function() {
  it("contains spec with an expectation", function() {
    expect(true).toBe(true);
  });

  it("contains spec with a false expectation", function() {
    expect(true).not.toBe(false);
  });
});


describe("A FlagLoader suite", function() {
  it("should generate flags for 'firefox39'", function() {
    console.log("starting firefox39 test");
    results = {
      'tracking': 'tracking_firefox39',
      'status': 'status_firefox39'
    }
    expect(FlagLoader.generateFlags("firefox39")).toEqual(results);
  });

  it("should init properly for esr38", function() {
    console.log("starting esr38 test");

    results = {
      tracking: 'tracking_firefox_esr38',
      status: 'status_firefox_esr38'
    }

    var loadCallback = function loadCallback(flagData) {
     console.log(flagData, results);
     expect(flagData).toEqual(results);
    };

    var errorCallback = function errorCallback(jqResponse, textStatus, errorThrown) {};

    FlagLoader.init("3ae7fd12f53f", "mozilla-esr38", loadCallback, errorCallback);
  });

  it("should init properly for mozilla-central", function(done) {
    console.log("starting mozilla-central test");

    results = {
      tracking: 'tracking_firefox42',
      status: 'status_firefox42'
    }

    var loadCallback = function loadCallback(flagData) {
     console.log(flagData, results);
     expect(flagData).toEqual(results);
     done();
    };

    var errorCallback = function errorCallback(jqResponse, textStatus, errorThrown) {};

    FlagLoader.init("1d4f44ee5166", "mozilla-central", loadCallback, errorCallback);
  }, 10000);

  it("should init properly for mozilla-beta", function(done) {
    console.log("starting mozilla-beta test");

    results = {
      tracking: 'tracking_firefox41',
      status: 'status_firefox41'
    }

    var loadCallback = function loadCallback(flagData) {
     console.log(flagData, results);
     expect(flagData).toEqual(results);
     done();
    };

    var errorCallback = function errorCallback(jqResponse, textStatus, errorThrown) {};

    FlagLoader.init("510a87909ff5", "mozilla-beta", loadCallback, errorCallback);
  }, 10000);

  it("should init properly for comm-beta", function(done) {
      console.log("starting comm-beta test");

      results = {
          tracking: 'tracking_thunderbird_75',
          status: 'status_thunderbird_75'
      }

      var loadCallback = function loadCallback(flagData) {
          console.log(flagData, results);
          expect(flagData).toEqual(results);
          done();
      };

      var errorCallback = function errorCallback(jqResponse, textStatus, errorThrown) {};

      FlagLoader.init("df290067118a", "comm-beta", loadCallback, errorCallback);
  }, 10000);
});

describe("A PushData suite", function() {
  it("should keep as backout: 'Backed out 2 changesets (bug 1457863) for merge conflict on a CLOSED TREE'", function() {
    console.log("starting backout status should be kept");
    push = {"cset":"6340700abe0f",
            "hgLink":"https://hg.mozilla.org/mozilla-central/rev/6340700abe0f",
            "desc":"Backed out 2 changesets (bug 1457863) for merge conflict on a CLOSED TREE",
            "files":["build.gradle",
                     "mobile/android/geckoview/build.gradle",
                     "mobile/android/geckoview/src/androidTest/java/org/mozilla/geckoview/test/GeckoSessionTestRuleTest.kt",
                     "mobile/android/geckoview/src/androidTest/java/org/mozilla/geckoview/test/NavigationDelegateTest.kt",
                     "mobile/android/geckoview/src/androidTest/java/org/mozilla/geckoview/test/ProgressDelegateTest.kt"],
            "email":"somepusher@example.com",
            "author":"Some Pusher",
            "isMerge":false,
            "isBackout":true,
            "tags":["bugherder","backout"],
            "affected":[19,20]};
    PushData.checkIfBackout(push);
    expect(push.isBackout).toEqual(true);
  });

  it("should classify as backout: 'Revert changeset d856b4067e80 (bug 1421144) to work around the crashes in bug 1424505. r=Jamie, a=RyanVM'", function() {
    console.log("starting backout detection (ignore) if 'revert' somewhere in the bug description");
    push = {"cset":"f1d078c9252a",
            "hgLink":"https://hg.mozilla.org/releases/mozilla-release/rev/f1d078c9252a",
            "desc":"Revert changeset d856b4067e80 (bug 1421144) to work around the crashes in bug 1424505. r=Jamie, a=RyanVM",
            "files":["accessible/windows/msaa/RootAccessibleWrap.cpp",
                     "accessible/windows/msaa/RootAccessibleWrap.h"],
            "email":"somepusher@example.com",
            "author":"Some Pusher",
            "isMerge":false,
            "tags":["bugherder","backout","uplift"],
            "affected":[]};
    PushData.checkIfBackout(push);
    expect(push.isBackout).toEqual(true);
  });

  it("should not classify as backout: 'Bug 1450377 [wpt PR 10259] - Revert #10240, a=testonly'", function() {
    console.log("starting backout detection (ignore) if 'revert' somewhere in the bug description");
    push = {"cset":"d0f81666d0aa",
            "hgLink":"https://hg.mozilla.org/mozilla-central/rev/d0f81666d0aa",
            "desc":"Bug 1452643 [wpt PR 9780] - Update the encoding IDL file, a=testonly",
            "files":["testing/web-platform/meta/MANIFEST.json",
                     "testing/web-platform/tests/encoding/idlharness.html",
                     "testing/web-platform/tests/interfaces/encoding.idl"],
            "email":"somepusher@example.com",
            "author":"Some Pusher",
            "bug":"1452643",
            "isMerge":false,
            "tags":["bugherder"]};
    PushData.checkIfBackout(push);
    expect(push.isBackout).toEqual(false);
  });

  it("should not classify as backout: 'Bug 1449532 - Part III, Polyfill Web Animation API features r=Gijs'", function() {
    console.log("starting backout detection (ignore) if 'revert' somewhere in the bug description");
    push = {'cset': '64486670492f',
            'hgLink': 'https://hg.mozilla.org/mozilla-central/rev/64486670492f',
            'desc': 'Bug 1449532 - Part III, Polyfill Web Animation API features r=Gijs',
            'files': ['toolkit/content/widgets/videocontrols.xml',
                     'toolkit/themes/shared/media/videocontrols.css'],
            "email":"somepusher@example.com",
            "author":"Some Pusher",
            'bug': '1449532',
            'isMerge': false,
            'tags': ['bugherder']
};
    PushData.checkIfBackout(push);
    expect(push.isBackout).toEqual(false);
  });
});


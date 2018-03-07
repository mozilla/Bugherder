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

  it("should init properly for mozilla-aurora", function(done) {
    console.log("starting mozilla-aurora test");

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

    FlagLoader.init("510a87909ff5", "mozilla-aurora", loadCallback, errorCallback);
  }, 10000);
});


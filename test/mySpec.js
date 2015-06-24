describe("A suite", function() {
  it("contains spec with an expectation", function() {
    expect(true).toBe(true);
  });

  it("contains spec with a false expectation", function() {
    expect(true).not.toBe(false);
  });

  it("should test FlagLoader.js maybe 4realz", function() {
    var results = {
      'tracking': 'tracking_firefox39',
      'status': 'status_firefox39'
    }
    expect(FlagLoader.generateFlags("firefox39")).toEqual(results);
  });
});


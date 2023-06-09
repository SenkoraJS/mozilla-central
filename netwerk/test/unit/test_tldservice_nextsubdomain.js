"use strict";

function run_test() {
  var tests = [
    { data: "bar.foo.co.uk", result: "foo.co.uk" },
    { data: "foo.bar.foo.co.uk", result: "bar.foo.co.uk" },
    { data: "foo.co.uk", throw: true },
    { data: "co.uk", throw: true },
    { data: ".co.uk", throw: true },
    { data: "com", throw: true },
    { data: "tûlîp.foo.fr", result: "foo.fr" },
    { data: "tûlîp.fôû.fr", result: "xn--f-xgav.fr" },
    { data: "file://foo/bar", throw: true },
  ];

  tests.forEach(function (test) {
    try {
      var r = Services.eTLD.getNextSubDomain(test.data);
      Assert.equal(r, test.result);
    } catch (e) {
      Assert.ok(test.throw);
    }
  });
}

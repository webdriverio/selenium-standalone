var assert = require("assert")
var getSeleniumHub = require('../lib/get-selenium-hub');

describe('getSeleniumHub', function () {
  var data = [{args: [], expectedHostPort: 'localhost:4444'},
              {args: ['-port', '5555'], expectedHostPort: 'localhost:5555'},
              {args: ['-hub', 'http://foo/wd/register'], expectedHostPort: 'foo:4444'},
              {args: ['-hub', 'http://foo:6666/wd/register'], expectedHostPort: 'foo:6666'},
              {args: ['-hub', 'http://foo/wd/register', '-port', '7777'], expectedHostPort: 'foo:7777'},
              {args: ['-hub', 'http://foo:6666/wd/register', '-port', '7777'], expectedHostPort: 'foo:7777'}];

  var testWithData = function (dataItem) {
    return function () {
      var actual = getSeleniumHub(dataItem.args);
      var expected = 'http://' + dataItem.expectedHostPort + '/wd/hub/status';

      assert.equal(actual, expected);
    };
  };

  data.forEach(function (dataItem) {
    it("getSeleniumHub with seleniumArgs: " + dataItem.args.join(" "), testWithData(dataItem));
  });
});

var assert = require("assert")
var getSeleniumHub = require('../lib/get-selenium-hub');

describe('getSeleniumHub', function () {
  var data = [{args: [], expected: 'http://localhost:4444/wd/hub/status'},
              {args: ['-port', '5555'], expected: 'http://localhost:5555/wd/hub/status'},
              {args: ['-hub', 'http://foo/wd/register'], expected: 'http://foo:4444/wd/hub/status'},
              {args: ['-hub', 'http://foo:6666/wd/register'], expected: 'http://foo:6666/wd/hub/status'},
              {args: ['-hub', 'http://foo/wd/register', '-port', '7777'], expected: 'http://foo:7777/wd/hub/status'},
              {args: ['-hub', 'http://foo:6666/wd/register', '-port', '7777'], expected: 'http://foo:7777/wd/hub/status'}];

  var testWithData = function (dataItem) {
    return function () {
      assert.equal(getSeleniumHub(dataItem.args), dataItem.expected);
    };
  };

  data.forEach(function (dataItem) {
    it("getSeleniumHub with seleniumArgs: " + dataItem.args.join(" "), testWithData(dataItem));
  });
});

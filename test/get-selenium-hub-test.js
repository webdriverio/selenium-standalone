var assert = require("assert");
var getSeleniumStatusUrl = require('../lib/get-selenium-status-url');
var nodeUriPath = '/wd/hub/status';

describe('getSeleniumStatusUrl', function () {
  var data = [{args: [], expectedUrl: 'localhost:4444' + nodeUriPath},
              {args: ['-port', '5555'], expectedUrl: 'localhost:5555' + nodeUriPath},
              {args: ['-hub', 'http://foo/wd/register'], expectedUrl: 'foo:4444' + nodeUriPath},
              {args: ['-role', 'hub'], expectedUrl: 'localhost:4444/api/grid/hub/'},
              {args: ['-role', 'node'], expectedUrl: 'localhost:5555' + nodeUriPath},
              {args: ['-role', 'node', '-hub', 'http://foo:6666/wd/register'], expectedUrl: 'foo:6666' + nodeUriPath},
              {args: ['-hub', 'http://foo:6666/wd/register'], expectedUrl: 'foo:6666' + nodeUriPath},
              {args: ['-hub', 'http://foo/wd/register', '-port', '7777'], expectedUrl: 'foo:7777' + nodeUriPath},
              {args: ['-hub', 'http://foo:6666/wd/register', '-port', '7777'], expectedUrl: 'foo:7777' + nodeUriPath}];

  var testWithData = function (dataItem) {
    return function () {
      var actual = getSeleniumStatusUrl(dataItem.args);
      var expected = 'http://' + dataItem.expectedUrl;

      assert.equal(actual, expected);
    };
  };

  data.forEach(function (dataItem) {
    it('getSeleniumStatusUrl with seleniumArgs: ' + dataItem.args.join(' '), testWithData(dataItem));
  });
});

var assert = require("assert");
var getSeleniumStatusUrl = require('../lib/get-selenium-status-url');
var nodeStatusAPIPath = '/wd/hub/status';
var hubStatusAPIPath = '/grid/api/hub';

describe('getSeleniumStatusUrl', function () {
  var data = [
              // If started with both modes active, check the status of the `node`
              {args: [], expectedUrl: 'localhost:4444' + nodeStatusAPIPath},
              {args: ['-port', '5555'], expectedUrl: 'localhost:5555' + nodeStatusAPIPath},
              {args: ['-hub', 'http://foo/wd/register'], expectedUrl: 'foo:4444' + nodeStatusAPIPath},
              {args: ['-hub', 'http://foo:6666/wd/register'], expectedUrl: 'foo:6666' + nodeStatusAPIPath},
              {args: ['-hub', 'http://foo/wd/register', '-port', '7777'], expectedUrl: 'foo:7777' + nodeStatusAPIPath},
              {args: ['-hub', 'http://foo:6666/wd/register', '-port', '7777'], expectedUrl: 'foo:7777' + nodeStatusAPIPath},

              // If started with only `hub` mode, only check status of itself
              {args: ['-role', 'hub'], expectedUrl: 'localhost:4444' + hubStatusAPIPath},

              // If started with only `node` mode, check status of remote hub instance
              {args: ['-role', 'node'], expectedUrl: 'localhost:5555' + hubStatusAPIPath},
              {args: ['-role', 'node', '-hub', 'http://foo:6666/wd/register'], expectedUrl: 'foo:6666' + hubStatusAPIPath}
            ];

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

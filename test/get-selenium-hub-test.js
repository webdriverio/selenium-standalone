const path = require('path');
const assert = require('assert');
const statusUrl = require('../lib/get-selenium-status-url');

//const nodeStatusAPIPath = '/wd/hub/status';
const nodeStatusAPIPathV4 = '/status';
const hubStatusAPIPath = '/grid/api/hub';
describe('getRunningProcessType', () => {
  const tests = [
    // Started as a standalone Selenium Server
    { args: [], expected: statusUrl.PROCESS_TYPES.STANDALONE },
    { args: ['-port', '5555'], expected: statusUrl.PROCESS_TYPES.STANDALONE },
    { args: ['-hub', 'https://foo/wd/register'], expected: statusUrl.PROCESS_TYPES.STANDALONE }, // `-hub` arg is ignored

    // Started as a Selenium Grid hub
    { args: ['-role', 'hub'], expected: statusUrl.PROCESS_TYPES.GRID_HUB },

    // Started as a Selenium Grid node
    { args: ['-role', 'node'], expected: statusUrl.PROCESS_TYPES.GRID_NODE },
    { args: ['-role', 'node', '-hub', 'https://foo/wd/register'], expected: statusUrl.PROCESS_TYPES.GRID_NODE },
  ];

  tests.forEach((test) => {
    it('getRunningProcessType with seleniumArgs: ' + test.args.join(' '), () => {
      const actual = statusUrl.getRunningProcessType(test.args);
      assert.strictEqual(actual, test.expected);
    });
  });
});

describe('getSeleniumStatusUrl', () => {
  const data = [
    // Started as a standalone Selenium Server
    { args: [], expectedUrl: 'localhost:4444' + nodeStatusAPIPathV4, opts: { version: '4.1' } },
    { args: ['-port', '5678'], expectedUrl: 'localhost:5678' + nodeStatusAPIPathV4, opts: { version: '4.1' } },
    {
      args: ['-hub', 'https://foo/wd/register'],
      expectedUrl: 'localhost:4444' + nodeStatusAPIPathV4,
      opts: { version: '4.1' },
    },
    {
      args: ['-hub', 'https://foo:6666/wd/register', '-port', '7777'],
      opts: { version: '4.1' },
      expectedUrl: 'localhost:7777' + nodeStatusAPIPathV4,
    },

    // Started as a Selenium Grid hub
    { args: ['-role', 'hub'], expectedUrl: 'localhost:4444' + hubStatusAPIPath, opts: { version: '4.1' } },
    {
      args: ['-role', 'hub', '-port', '12345'],
      expectedUrl: 'localhost:12345' + hubStatusAPIPath,
      opts: { version: '4.1' },
    },
    {
      args: ['-role', 'hub', '-host', 'alias', '-port', '12345'],
      expectedUrl: 'alias:12345' + hubStatusAPIPath,
      opts: { version: '4.1' },
    },
    {
      args: ['-role', 'hub', '-hub', 'https://foo/wd/register'],
      expectedUrl: 'localhost:4444' + hubStatusAPIPath,
      opts: { version: '4.1' },
    },
    {
      args: ['-role', 'hub', '-hub', 'https://foo:6666/wd/register', '-port', '12345'],
      expectedUrl: 'localhost:12345' + hubStatusAPIPath,
      opts: { version: '4.1' },
    },

    // Started as a Selenium Grid node
    { args: ['-role', 'node'], expectedUrl: 'localhost:5555' + nodeStatusAPIPathV4, opts: { version: '4.1' } },
    {
      args: ['-role', 'node', '-port', '7777'],
      expectedUrl: 'localhost:7777' + nodeStatusAPIPathV4,
      opts: { version: '4.1' },
    },
    {
      args: ['-role', 'node', '-host', 'alias', '-port', '7777'],
      expectedUrl: 'alias:7777' + nodeStatusAPIPathV4,
      opts: { version: '4.1' },
    },
    {
      args: ['-role', 'node', '-hub', 'https://foo/wd/register'],
      expectedUrl: 'localhost:5555' + nodeStatusAPIPathV4,
      opts: { version: '4.1' },
    },
    {
      args: ['-role', 'node', '-hub', 'https://foo:6666/wd/register', '-port', '7777'],
      expectedUrl: 'localhost:7777' + nodeStatusAPIPathV4,
      opts: { version: '4.1' },
    },

    {
      args: ['-role', 'node', '-nodeConfig', path.join(__dirname, 'fixtures', 'config.node.json')],
      opts: { version: '4.1' },
      expectedUrl: 'foo:123' + nodeStatusAPIPathV4,
    },
    {
      args: ['-role', 'node', '-host', 'alias', '-nodeConfig', path.join(__dirname, 'fixtures', 'config.node.json')],
      expectedUrl: 'alias:123' + nodeStatusAPIPathV4,
      opts: { version: '4.1' },
    },
    {
      args: [
        '-role',
        'node',
        '-host',
        'alias',
        '-port',
        '7777',
        '-nodeConfig',
        path.join(__dirname, 'fixtures', 'config.node.json'),
      ],
      opts: { version: '4.1' },
      expectedUrl: 'alias:7777' + nodeStatusAPIPathV4,
    },
  ];
  const testWithData = function (dataItem) {
    return function () {
      const actual = statusUrl.getSeleniumStatusUrl(dataItem.args, dataItem.opts);
      const expected = 'http://' + dataItem.expectedUrl;

      assert.strictEqual(actual, expected);
    };
  };

  data.forEach((dataItem) => {
    it('getSeleniumStatusUrl with seleniumArgs: ' + dataItem.args.join(' '), testWithData(dataItem));
  });
});

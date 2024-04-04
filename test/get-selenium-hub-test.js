const path = require('path');
const assert = require('assert');
const statusUrl = require('../lib/get-selenium-status-url');

describe('getRunningProcessType', () => {
  const tests = [
    // Started as a standalone Selenium Server
    { args: [], expected: statusUrl.PROCESS_TYPES.STANDALONE },
    { args: ['--port', '5555'], expected: statusUrl.PROCESS_TYPES.STANDALONE },
    { args: ['--grid-url', 'https://foo/wd/register'], expected: statusUrl.PROCESS_TYPES.STANDALONE }, // `-hub` arg is ignored

    // Started as a Selenium Grid hub
    { args: ['hub'], expected: statusUrl.PROCESS_TYPES.GRID_HUB },

    // Started as a Selenium Grid node
    { args: ['node'], expected: statusUrl.PROCESS_TYPES.GRID_NODE },
    { args: ['node', '--grid-url', 'https://foo/wd/register'], expected: statusUrl.PROCESS_TYPES.GRID_NODE },
  ];

  tests.forEach((test) => {
    it('getRunningProcessType with seleniumArgs: ' + test.args.join(' '), () => {
      const actual = statusUrl.getRunningProcessType(test.args);
      assert.strictEqual(actual, test.expected);
    });
  });
});

describe('getSeleniumStatusUrl', () => {
  /** @type {ReadonlyArray<{ version: '3.141.59' | '4.5.0', args: string[],  expected: string}>} */
  const data = [
    // standalone
    { args: [], version: '3.141.59', expected: 'localhost:4444/wd/hub/status' },
    { args: [], version: '4.5.0', expected: 'localhost:4444/status' },

    // standalone: It should set the port
    { args: ['-port', '5678'], version: '3.141.59', expected: 'localhost:5678/wd/hub/status' },
    {
      args: ['--port', '5678'],
      version: '4.5.0',
      expected: 'localhost:5678/status',
    },

    // standalone - --grid-url is not used
    {
      args: ['--grid-url', 'https://foo/wd/register'],
      version: '3.141.59',
      expected: 'localhost:4444/wd/hub/status',
    },
    {
      args: ['--grid-url', 'https://foo/wd/register'],
      version: '4.5.0',
      expected: 'localhost:4444/status',
    },

    // hub
    { args: ['hub'], version: '3.141.59', expected: 'localhost:4444/grid/api/hub' },
    { args: ['hub'], version: '4.5.0', expected: 'localhost:4444/grid/api/hub' },

    // hub - set port

    { args: ['hub', '-port', '12345'], version: '3.141.59', expected: 'localhost:12345/grid/api/hub' },
    {
      args: ['hub', '--port', '12345'],
      version: '4.5.0',
      expected: 'localhost:12345/grid/api/hub',
    },

    // hub - set host
    {
      args: ['hub', '-host', 'alias'],
      version: '3.141.59',
      expected: 'alias:4444/grid/api/hub',
    },
    {
      args: ['hub', '--host', 'alias'],
      version: '4.5.0',
      expected: 'alias:4444/grid/api/hub',
    },

    // node
    { args: ['node'], version: '3.141.59', expected: 'localhost:5555/wd/hub/status' },
    { args: ['node'], version: '4.5.0', expected: 'localhost:5555/status' },

    // node - set port
    { args: ['node', '-port', '7777'], version: '3.141.59', expected: 'localhost:7777/wd/hub/status' },
    {
      args: ['node', '--port', '7777'],
      version: '4.5.0',
      expected: 'localhost:7777/status',
    },

    // node - set host
    {
      args: ['node', '-host', 'alias'],
      version: '3.141.59',
      expected: 'alias:5555/wd/hub/status',
    },
    {
      args: ['node', '--host', 'alias'],
      version: '4.5.0',
      expected: 'alias:5555/status',
    },

    // node - -nodeConfig
    {
      args: ['node', '-nodeConfig', path.join(__dirname, 'fixtures', 'config.node.json')],
      version: '3.141.59',
      expected: 'foo:123/wd/hub/status',
    },
    {
      version: '4.5.0',
      args: ['node', '-nodeConfig', path.join(__dirname, 'fixtures', 'config.node.json')],
      expected: 'foo:123/status',
    },

    // node - set host overrides -nodeConfig
    {
      args: ['node', '-host', 'alias', '-nodeConfig', path.join(__dirname, 'fixtures', 'config.node.json')],
      version: '3.141.59',
      expected: 'alias:123/wd/hub/status',
    },
    {
      args: ['node', '--host', 'alias', '-nodeConfig', path.join(__dirname, 'fixtures', 'config.node.json')],
      version: '4.5.0',
      expected: 'alias:123/status',
    },

    // node - set post overrides -nodeConfig
    {
      args: ['node', '-port', '7777', '-nodeConfig', path.join(__dirname, 'fixtures', 'config.node.json')],
      version: '3.141.59',
      expected: 'foo:7777/wd/hub/status',
    },
    {
      args: ['node', '--port', '7777', '-nodeConfig', path.join(__dirname, 'fixtures', 'config.node.json')],
      version: '4.5.0',
      expected: 'foo:7777/status',
    },
  ];

  data.forEach((dataItem) => {
    it(`getSeleniumStatusUrl (version: : ${dataItem.version}) with args : ${dataItem.args.join(' ')}`, () => {
      const actual = statusUrl.getSeleniumStatusUrl(dataItem.args, { version: dataItem.version });
      const expected = 'http://' + dataItem.expected;

      assert.strictEqual(actual.toString(), expected);
    });
  });
});

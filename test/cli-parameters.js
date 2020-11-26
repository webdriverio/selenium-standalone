const path = require('path');
const chai = require('chai');

const expect = chai.expect;
let parseCommandAndOptions;
let processNodeEnv;

/**
 * Builds a valid ARGV array with passed arguments.
 */
function buildArgv(args) {
  let argv = ['/somewhere/node', '/somewhere/selenium-standalone'];

  if (args) {
    argv = argv.concat(args);
  }
  return argv;
}

/**
 * Tests for `selenium-standalone` command parameters parsing.
 */
describe('`selenium-standalone` command parameters', () => {
  // Allow tests to mock `process.platform`
  before(function () {
    this.originalArgv = Object.getOwnPropertyDescriptor(process, 'argv');
  });
  after(function () {
    Object.defineProperty(process, 'argv', this.originalArgv);
  });

  // Ensure that any internal state of the module is clean for each test
  beforeEach(() => {
    if (process.env) {
      processNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test-cli-parameters';
    } else {
      process.env = { NODE_ENV: 'test-cli-parameters' };
    }
    parseCommandAndOptions = require('../bin/selenium-standalone').bind(null, '/path/to/java');
  });
  afterEach(() => {
    delete require.cache[require.resolve('../bin/selenium-standalone')];
    if (processNodeEnv) {
      process.env.NODE_ENV = processNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe('action', () => {
    it('is required', () => {
      process.argv = buildArgv();
      expect(parseCommandAndOptions).to.throw(/^No action provided$/);
    });

    it('only accepts valid values', () => {
      process.argv = buildArgv(['test']);
      expect(parseCommandAndOptions).to.throw(/^Invalid action /);
      process.argv = buildArgv(['install']);
      expect(parseCommandAndOptions).to.not.throw();
      process.argv = buildArgv(['start']);
      expect(parseCommandAndOptions).to.not.throw();
    });
  });

  describe('arguments', () => {
    it('are correctly parsed', () => {
      process.argv = buildArgv(['install', '--test=1', '-a', 'ok', '-h']);
      const parsed = parseCommandAndOptions();

      expect(parsed[1].test).to.be.equal(1);
      expect(parsed[1].a).to.be.equal('ok');
      expect(parsed[1].h).to.be.true;
    });

    it('are correctly passed unparsed to selenium when after --', () => {
      process.argv = buildArgv(['install', '--test=1', '--', '--test=1', '-a', 'ok', '-h']);
      const parsed = parseCommandAndOptions();

      expect(parsed[1].test).to.be.equal(1);
      expect(parsed[1].a).to.be.undefined;
      expect(parsed[1].seleniumArgs).to.deep.equal(['--test=1', '-a', 'ok', '-h']);
    });

    it('takes default values when not specified', () => {
      process.argv = buildArgv(['install']);
      const parsed1 = parseCommandAndOptions('/somewhere');
      const defaultValues = require('../lib/default-config');

      Object.keys(defaultValues).forEach((key) => {
        expect(parsed1[1][key]).to.deep.equal(defaultValues[key]);
      });

      process.argv = buildArgv(['install', '--drivers.chrome.version=42']);
      const parsed2 = parseCommandAndOptions('/somewhere');

      expect(parsed2[1].drivers.chrome.version).to.be.equal('42');
      expect(parsed2[1].drivers.chrome.baseURL).to.be.equal(defaultValues.drivers.chrome.baseURL);
    });

    it('are correctly parsed from a JSON config file', () => {
      process.argv = buildArgv(['install', '--config=' + path.join(__dirname, 'fixtures', 'config.valid.json')]);
      const parsed = parseCommandAndOptions('/somewhere');

      expect(parsed[1].version).to.be.equal('42');
      expect(parsed[1].drivers.ie.version).to.be.equal(42);
      expect(parsed[1].drivers.ie.baseURL).to.be.equal('http://www.google.fr');
      expect(parsed[1].seleniumArgs).to.be.deep.equal([]);
    });

    it('are correctly parsed from a JS module config file', () => {
      process.argv = buildArgv(['install', '--config=' + path.join(__dirname, 'fixtures', 'config.valid.js')]);
      const parsed = parseCommandAndOptions('/somewhere');

      expect(parsed[1].version).to.be.equal('42');
      expect(parsed[1].drivers.ie.version).to.be.equal(42);
      expect(parsed[1].drivers.ie.baseURL).to.be.equal('http://www.google.fr');
      expect(parsed[1].seleniumArgs).to.be.deep.equal(['--test=1', '-flag']);
    });

    it('throws if config file is invalid', () => {
      process.argv = buildArgv(['install', '--config=' + path.join(__dirname, 'fixtures', 'config.invalid.json')]);

      expect(parseCommandAndOptions).to.throw(/^Error parsing config file :/);
    });

    it('throws if config file is not an object', () => {
      process.argv = buildArgv(['install', '--config=' + path.join(__dirname, 'fixtures', 'config.invalid.js')]);

      expect(parseCommandAndOptions).to.throw(/^Error parsing config file : Config file does not exports an object$/);
    });

    it('respects the precedence order : command line > config file > default', () => {
      const defaultValues = require('../lib/default-config');

      process.argv = buildArgv([
        'install',
        '--config=' + path.join(__dirname, 'fixtures', 'config.valid.js'),
        '--drivers.ie.version=43',
        '--',
        '--some=seleniumArgs',
      ]);

      const parsed = parseCommandAndOptions('/somewhere');

      expect(parsed[1].version).to.be.equal('42');
      expect(parsed[1].drivers.ie.arch).to.be.equal(defaultValues.drivers.ie.arch);
      expect(parsed[1].drivers.ie.version).to.be.equal('43');
      expect(parsed[1].seleniumArgs).to.be.deep.equal(['--some=seleniumArgs']);
    });

    it('ignores extra drivers when specified', () => {
      const defaultConfig = require('../lib/default-config');

      process.argv = buildArgv([
        'start',
        '--config=' + path.join(__dirname, 'fixtures', 'config.ignoreExtraDrivers.js'),
      ]);

      const parsed = parseCommandAndOptions('/somewhere');

      expect(parsed[1].drivers.chrome.version).to.be.equal(999);
      expect(parsed[1].drivers.chrome.baseURL).to.be.equal(defaultConfig.drivers.chrome.baseURL);
      expect(parsed[1].drivers.ie).to.be.undefined;
      expect(parsed[1].drivers.edge).to.be.undefined;
      expect(parsed[1].drivers.firefox).to.be.undefined;
    });
  });
});

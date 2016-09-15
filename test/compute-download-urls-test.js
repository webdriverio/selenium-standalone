var assert = require('assert');

var computeDownloadUrls;

/*
default-config

module.exports = {
  baseURL: 'https://selenium-release.storage.googleapis.com',
  version: '2.53.1',
  drivers: {
    chrome: {
      version: '2.23',
      arch: process.arch,
      baseURL: 'https://chromedriver.storage.googleapis.com'
    },
    ie: {
      version: '2.53.1',
      arch: process.arch,
      baseURL: 'https://selenium-release.storage.googleapis.com'
    },
    firefox: {
      version: '0.10.0',
      arch: process.arch,
      baseURL: 'https://github.com/mozilla/geckodriver/releases/download'
    }
  }
};
*/

/**
 * Tests for the `computeDownloadUrls` module.
 * 
 * NOTE: This does not verify that the module is returning valid URLs that will respond with
 * the desired binary files. Just that the logic contained in the module, specifically for
 * handling when paths formats differ between versions of the same driver.
 */
describe('compute-download-urls', function() {
  // Allow tests to mock `process.platform`
  before(function() {
    this.originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
  });
  after(function() {
    Object.defineProperty(process, 'platform', this.originalPlatform);
  });

  // Ensure that any internal state of the module is clean for each test
  beforeEach(function() {
    computeDownloadUrls = require('../lib/compute-download-urls');
  });
  afterEach(function() {
    delete require.cache[require.resolve('../lib/compute-download-urls')];
  });

  var opts;
  
  describe('selenium-jar', function() {
    it('basic version', function() {
      var actual = computeDownloadUrls({
        seleniumVersion: '1.0',
        seleniumBaseURL: 'https://localhost',
        drivers: {}
      });

      assert.equal(actual.selenium, 'https://localhost/1.0/selenium-server-standalone-1.0.jar');
    });

    it('version with patch', function() {
      var actual = computeDownloadUrls({
        seleniumVersion: '1.0.1',
        seleniumBaseURL: 'https://localhost',
        drivers: {}
      });

      assert.equal(actual.selenium, 'https://localhost/1.0/selenium-server-standalone-1.0.1.jar');
    });

    it('version with beta string', function() {
      var actual = computeDownloadUrls({
        seleniumVersion: '3.0.0-beta2',
        seleniumBaseURL: 'https://localhost',
        drivers: {}
      });

      assert.equal(actual.selenium, 'https://localhost/3.0-beta2/selenium-server-standalone-3.0.0-beta2.jar');
    });
  });

  describe('chrome', function() {
    beforeEach(function() {
      opts = {
        seleniumVersion: '1.0',
        seleniumBaseURL: 'https://localhost',
        drivers: {
          chrome: {}
        }
      };
    });
    
    describe('linux', function() {
      before(function() {
        Object.defineProperty(process, 'platform', {
          value: 'linux'
        });
      });

      it('x32', function() {
        opts.drivers.chrome = {
          baseURL: 'https://localhost',
          version: '2.0',
          arch: 'x32'
        }

        var actual = computeDownloadUrls(opts);
        assert.equal(actual.chrome, 'https://localhost/2.0/chromedriver_linux32.zip');
      });

      it('x64', function() {
        opts.drivers.chrome = {
          baseURL: 'https://localhost',
          version: '2.0',
          arch: 'x64'
        }

        var actual = computeDownloadUrls(opts);
        assert.equal(actual.chrome, 'https://localhost/2.0/chromedriver_linux64.zip');
      });
    });

    describe('mac', function() {
      before(function() {
        Object.defineProperty(process, 'platform', {
          value: 'darwin'
        });
      });

      it('Use `mac32` for versions < 2.23', function() {
        opts.drivers.chrome = {
          baseURL: 'https://localhost',
          version: '2.22',
          arch: ''
        }

        var actual = computeDownloadUrls(opts);
        assert.equal(actual.chrome, 'https://localhost/2.22/chromedriver_mac32.zip');
      })

      it('Use `mac64` for versions >= 2.23', function() {
        opts.drivers.chrome = {
          baseURL: 'https://localhost',
          version: '2.23',
          arch: ''
        }

        var actual = computeDownloadUrls(opts);
        assert.equal(actual.chrome, 'https://localhost/2.23/chromedriver_mac64.zip');
      })
    });

    describe('win', function() {
      before(function() {
        Object.defineProperty(process, 'platform', {
          value: 'win'
        });
      });

      it('basic version', function() {
        opts.drivers.chrome = {
          baseURL: 'https://localhost',
          version: '2.0',
          arch: ''
        }

        var actual = computeDownloadUrls(opts);
        assert.equal(actual.chrome, 'https://localhost/2.0/chromedriver_win32.zip');
      });
    });
  });

  describe('firefox', function() {
    beforeEach(function() {
      opts = {
        seleniumVersion: '1.0',
        seleniumBaseURL: 'https://localhost',
        drivers: {
          firefox: {}
        }
      };
    });
    
    describe('linux', function() {

    });

    describe('mac', function() {

    });

    describe('win', function() {

    });
  });

  describe('ie', function() {
    beforeEach(function() {
      opts = {
        seleniumVersion: '1.0',
        seleniumBaseURL: 'https://localhost',
        drivers: {
          ie: {}
        }
      };
    });
  });
});
var assert = require('assert');
var merge = require('lodash').merge;
const got = require('got')

var defaultConfig = require('../lib/default-config');

var computeDownloadUrls;
var computedUrls;
var opts = {
  seleniumVersion: defaultConfig.version,
  seleniumBaseURL: defaultConfig.baseURL,
  drivers: defaultConfig.drivers
};

function doesDownloadExist(url, cb) {
  (async () => {
    try {
      const res = await got(url,{retry:0});
      if (res.statusCode >= 400) {
        return cb(new Error(`Error response code got from ${url}: ${res.statusCode} ${res.statusMessage}`));
      }      
      return cb(null);
    } catch (error) {
      return cb(new Error(`Error requesting ${url}. Error: ${error}`));
    }
  })();
}

/**
 * Tests to ensure that all the values listed in `default-config.js`
 * are actually downloadable.
 */
describe('default-downloads', function() {
  // Allow tests to mock `process.platform`
  before(function() {
    this.originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
  });
  after(function() {
    Object.defineProperty(process, 'platform', this.originalPlatform);
  });

  // Ensure that any internal state of the module is clean for each test
  beforeEach(function() {
    this.timeout(60000);
    computeDownloadUrls = require('../lib/compute-download-urls');
  });
  afterEach(function() {
    delete require.cache[require.resolve('../lib/compute-download-urls')];
  });

  describe('selenium-jar', function() {
    it('selenium-jar download exists', function(done) {
      computedUrls = computeDownloadUrls(opts);
      doesDownloadExist(computedUrls.selenium, done);
    });
  });

  describe('ie', function() {
    before(function(){
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      });
    });

    it('ia32 download exists', function(done) {
      opts = merge(opts, {
        drivers: {
          ie: {
            arch: 'ia32'
          }
        }
      });

      computedUrls = computeDownloadUrls(opts);

      assert(computedUrls.ie.indexOf('Win32') > 0);
      doesDownloadExist(computedUrls.ie, done);
    });

    it('x64 download exists', function(done) {
      opts = merge(opts, {
        drivers: {
          ie: {
            arch: 'x64'
          }
        }
      });

      computedUrls = computeDownloadUrls(opts);

      assert(computedUrls.ie.indexOf('x64') > 0);
      doesDownloadExist(computedUrls.ie, done);
    });
  });

  describe('edge', function() {
    before(function(){
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      });

    });

    var releases = require('../lib/microsoft-edge-releases')

    Object.keys(releases).forEach(function (version) {
      it('version `' + version + '` download exists', function(done) {
          opts = merge(opts, {
            drivers: {
              edge: {
                version: version
              }
            }
          });

        computedUrls = computeDownloadUrls(opts);

        assert.equal(computedUrls.edge, releases[version].url);
        doesDownloadExist(computedUrls.edge, done);
      });
    });
  });

  describe('chrome', function() {
    describe('linux', function() {
      before(function(){
        Object.defineProperty(process, 'platform', {
          value: 'linux'
        });
      });

      // No x32 for latest chromedriver on linux

      it('x64 download exists', function(done) {
        opts = merge(opts, {
          drivers: {
            chrome: {
              arch: 'x64'
            }
          }
        });

        computedUrls = computeDownloadUrls(opts);

        assert(computedUrls.chrome.indexOf('linux64') > 0);
        doesDownloadExist(computedUrls.chrome, done);
      });
    });

    describe('mac', function() {
      before(function(){
        Object.defineProperty(process, 'platform', {
          value: 'darwin'
        });
      });

      // No x32 for latest chromedriver on mac

      it('x64 download exists', function(done) {
        computedUrls = computeDownloadUrls(opts);

        assert(computedUrls.chrome.indexOf('mac64') > 0);
        doesDownloadExist(computedUrls.chrome, done);
      });
    });

    describe('win', function() {
      before(function(){
        Object.defineProperty(process, 'platform', {
          value: 'win32'
        });
      });

      // No x64 for latest chromedriver on win

      it('x32 download exists', function(done) {
        computedUrls = computeDownloadUrls(opts);

        assert(computedUrls.chrome.indexOf('win32') > 0);
        doesDownloadExist(computedUrls.chrome, done);
      });
    });
  });

  describe('firefox', function() {
    this.timeout(10000)
    describe('linux', function() {
      before(function(){
        Object.defineProperty(process, 'platform', {
          value: 'linux'
        });
      });

      it('x64 download exists', function(done) {
        opts = merge(opts, {
          drivers: {
            firefox: {
              arch: 'x64'
            }
          }
        });

        computedUrls = computeDownloadUrls(opts);

        assert(computedUrls.firefox.indexOf('linux64') > 0);
        doesDownloadExist(computedUrls.firefox, done);
      });
    });

    describe('mac', function() {
      before(function(){
        Object.defineProperty(process, 'platform', {
          value: 'darwin'
        });
      });

      // No difference between arch for latest firefox driver on mac
      it('download exists', function(done) {
        computedUrls = computeDownloadUrls(opts);

        assert(computedUrls.firefox.indexOf('mac') > 0);
        doesDownloadExist(computedUrls.firefox, done);
      });
    });

    describe('win', function() {
      before(function(){
        Object.defineProperty(process, 'platform', {
          value: 'win32'
        });
      });

      it('ia32 download exists', function(done) {
        opts = merge(opts, {
          drivers: {
            firefox: {
              arch: 'ia32'
            }
          }
        });

        computedUrls = computeDownloadUrls(opts);

        assert(computedUrls.firefox.indexOf('win32') > 0);
        doesDownloadExist(computedUrls.firefox, done);
      });

      it('x64 download exists', function(done) {
        opts = merge(opts, {
          drivers: {
            firefox: {
              arch: 'x64'
            }
          }
        });

        computedUrls = computeDownloadUrls(opts);

        assert(computedUrls.firefox.indexOf('win64') > 0);
        doesDownloadExist(computedUrls.firefox, done);
      });
    });
  });
});

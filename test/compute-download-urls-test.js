var assert = require('assert');

var computeDownloadUrls = require('../lib/compute-download-urls');

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

    });

    describe('mac', function() {

    });

    describe('win', function() {

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
var fs = require('fs');
var path = require('path');
var isInstalled = require('../lib/isInstalled');
var computeDownloadUrls = require('../lib/compute-download-urls');
var computeFsPaths = require('../lib/compute-fs-paths');
var defaultConfig = require('../lib/default-config');

var from = path.join(__dirname, '..', '.selenium');
var to = path.join(__dirname, '..', '.selenium-tmp');

var fsPaths = computeFsPaths({
  seleniumVersion: defaultConfig.version,
  drivers: defaultConfig.drivers,
  basePath: defaultConfig.basePath
});

var urls = computeDownloadUrls({
  seleniumVersion: defaultConfig.version,
  seleniumBaseURL: defaultConfig.baseURL,
  drivers: defaultConfig.drivers
});

function assertSeleniumInstalled(expected, done) {
  isInstalled(
      fsPaths.selenium.installPath,
      urls.selenium,
      function (err, result) {
        if (err) {
          return done(err);
        }

        if (result !== expected) {
          return done(new Error('expected isInstalled to return ' + expected));
        }

        done();
      });
}

describe('isInstalled()', function () {
  describe('when files are installed', function () {
    it('should return true', function (done) {
      assertSeleniumInstalled(true, done);
    });
  });

  describe('when files are not installed', function () {
    beforeEach(function () {
      fs.renameSync(from, to);
    });

    afterEach(function () {
      fs.renameSync(to, from);
    });

    it('should return false', function (done) {
      assertSeleniumInstalled(false, done);
    })
  });
});

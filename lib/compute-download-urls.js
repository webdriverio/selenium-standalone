module.exports = computeDownloadUrls;

var util = require('util');

var CHROMEDRIVER_CDNURL = process.env.CHROMEDRIVER_CDNURL || 'http://chromedriver.storage.googleapis.com';
var SELENIUM_CDNURL = process.env.SELENIUM_CDNURL || 'http://selenium-release.storage.googleapis.com';

var urls = {
  selenium: SELENIUM_CDNURL + '/%s/selenium-server-standalone-%s.jar',
  chrome: CHROMEDRIVER_CDNURL + '/%s/chromedriver_%s.zip',
  ie: SELENIUM_CDNURL + '/%s/IEDriverServer_%s_%s.zip'
};

function computeDownloadUrls(opts) {
  // 2.44.0 => 2.44
  // 2.44.0 would be `patch`, 2.44 `minor`, 2 `major` as per semver
  var minorSeleniumVersion = opts.seleniumVersion.slice(0, opts.seleniumVersion.lastIndexOf('.'));

  return {
    selenium: util.format(
      urls.selenium,
      minorSeleniumVersion,
      opts.seleniumVersion
    ),
    chrome: util.format(
      urls.chrome,
      opts.drivers.chrome.version,
      getChromeDriverPlatform(opts.drivers.chrome.arch)
    ),
    ie: util.format(
      urls.ie,
      minorSeleniumVersion,
      getIeDriverArchitecture(opts.drivers.ie.arch),
      opts.drivers.ie.version
    )
  };
}

function getChromeDriverPlatform(wantedArchitecture) {
  var platform;

  if (process.platform === 'linux') {
    platform = 'linux' + (wantedArchitecture === 'x64' ? '64' : '32');
  } else if (process.platform === 'darwin') {
    platform = 'mac32';
  } else {
    platform = 'win32';
  }

  return platform;
}

function getIeDriverArchitecture(wanted) {
  var platform;

  if (wanted === 'ia32') {
    platform = 'Win32';
  } else {
    platform = 'x64';
  }

  return platform;
}

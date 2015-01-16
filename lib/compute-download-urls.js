module.exports = computeDownloadUrls;

var util = require('util');

var urls = {
  selenium: 'http://selenium-release.storage.googleapis.com/%s/selenium-server-standalone-%s.jar',
  chrome: 'http://chromedriver.storage.googleapis.com/%s/chromedriver_%s.zip',
  ie: 'http://selenium-release.storage.googleapis.com/%s/IEDriverServer_%s_%s.zip'
};

function computeDownloadUrls(opts) {
  // 2.44.0 => 2.44
  // 2.44.0 would be `patch`, 2.44 `minor`, 2 `major` as per semver
  var minorSeleniumVersion = opts.seleniumVersion.slice(0, opts.seleniumVersion.lastIndexOf('.'));

  return {
    selenium: util.format.apply(util, [
      urls.selenium,
      minorSeleniumVersion,
      opts.seleniumVersion
    ]),
    chrome: util.format.apply(util, [
      urls.chrome,
      opts.drivers.chrome.version,
      getChromeDriverPlatform(opts.drivers.chrome.arch)
    ]),
    ie: util.format.apply(util, [
      urls.ie,
      minorSeleniumVersion,
      getIeDriverArchitecture(opts.drivers.ie.arch),
      opts.drivers.ie.version
    ])
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

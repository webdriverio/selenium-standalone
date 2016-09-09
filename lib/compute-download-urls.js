module.exports = computeDownloadUrls;

var util = require('util');

var urls = {
  selenium: '%s/%s/selenium-server-standalone-%s.jar',
  chrome: '%s/%s/chromedriver_%s.zip',
  ie: '%s/%s/IEDriverServer_%s_%s.zip',
  firefox: '%s/v%s/geckodriver-%s-%s'
};

var mac32;

function computeDownloadUrls(opts, askedOpts) {
  // 2.44.0 => 2.44
  // 2.44.0 would be `patch`, 2.44 `minor`, 2 `major` as per semver

  var downloadUrls = {
    selenium: util.format(
      urls.selenium,
      opts.seleniumBaseURL,
      opts.seleniumVersion.replace(/(\d+\.\d+)\.\d/, "$1"),
      opts.seleniumVersion
    )
  };
  if (opts.drivers.chrome) {
    if (opts.drivers.chrome.version < 2.23) {
      mac32 = true;
    }
    downloadUrls.chrome = util.format(
      urls.chrome,
      opts.drivers.chrome.baseURL,
      opts.drivers.chrome.version,
      getChromeDriverPlatform(opts.drivers.chrome.arch)
    );
  }
  if (opts.drivers.ie) {
    downloadUrls.ie = util.format(
      urls.ie,
      opts.drivers.ie.baseURL,
      opts.drivers.ie.version.slice(0, opts.drivers.ie.version.lastIndexOf('.')),
      getIeDriverArchitecture(opts.drivers.ie.arch),
      opts.drivers.ie.version
    );
  }
  if (opts.drivers.firefox) {
    downloadUrls.firefox = util.format(
      urls.firefox,
      opts.drivers.firefox.baseURL,
      opts.drivers.firefox.version,
      'v' + opts.drivers.firefox.version,
      getFirefoxDriverArchitecture(opts.drivers.firefox.version)
    );
  }
  return downloadUrls;
}

function getChromeDriverPlatform(wantedArchitecture) {
  var platform;

  if (process.platform === 'linux') {
    platform = 'linux' + (wantedArchitecture === 'x64' ? '64' : '32');
  } else if (process.platform === 'darwin') {
    if (mac32) {
      platform = 'mac32';
    } else {
      platform = 'mac64';
    }
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

function getFirefoxDriverArchitecture(version) {
  var platform, type = '.tar.gz';

  if (process.platform === 'linux') {
    platform = 'linux64';
  } else if (process.platform === 'darwin') {
    if (version === '0.9.0') {
      platform = 'mac';
    } else if (version === '0.8.0') {
      platform = 'OSX';
    } else {
      // Everything newer than 0.9.0 should have this format
      // Everything older than 0.8.0 was called "wires," not geckodriver
      platform = 'macos';
    }
  } else if(process.platform === 'win32') {
    platform = 'win64';
    type = '.zip';
  } else if (process.arch === 'arm') {
    platform = 'arm7hf';
  } else {
    platform = '';
  }

  return platform + type;
}

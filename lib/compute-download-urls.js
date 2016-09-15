module.exports = computeDownloadUrls;

var util = require('util');

var urls = {
  selenium: '%s/%s/selenium-server-standalone-%s.jar',
  chrome: '%s/%s/chromedriver_%s.zip',
  ie: '%s/%s/IEDriverServer_%s_%s.zip',
  firefox: '%s/%s/%s-%s-%s'
};

var mac32;

/**
 * Computes the URL to download selenium.jar and drivers.
 * 
 * When passing in the `opts.drivers` param, it must be of the following format. Each of the drivers listed
 * inside is optional
 * 
 * {
 *   chrome: { ... },
 *   ie: { ... },
 *   firefox: { ... }
 * }
 * 
 * Each driver must have the following format.
 * 
 * {
 *   baseURL: '',  // Base URL for where to download driver from
 *   version: '',  // Version number string that matches the desired driver version
 *   arch: ''      // Architecture for the desired driver
 * }
 *
 * @param {string} opts.seleniumVersion - Version number string that matches the desired selenium.jar
 * @param {string} opts.seleniumBaseURL - Base URL for where to download selenium.jar from
 * @param {Object} opts.drivers - Object containing options for various drivers. See comment for object format.
 */
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
      getFirefoxDriverDirectory(opts.drivers.firefox.version),
      getFirefoxDriverName(opts.drivers.firefox.version),
      getFirefoxDriverVersionForUrl(opts.drivers.firefox.version),
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

function getFirefoxDriverDirectory(version) {
  var vLessVersions = ['0.3.0'];

  if (vLessVersions.indexOf(version) !== -1) {
    return version;
  }
  return 'v' + version;
}

function getFirefoxDriverName(version) {
  if (compareVersions(version, '0.8.0') >= 0) {
    return 'geckodriver';
  }
  return 'wires';
}

function getFirefoxDriverVersionForUrl(version) {
  if (compareVersions(version, '0.9.0') >= 0) {
    return 'v' + version;
  } else if (
    (process.platform === 'win32') &&
    (['0.5.0', '0.7.1', '0.8.0'].indexOf(version) !== -1)
  ) {
    return 'v' + version;
  }
  return version;
}

function getFirefoxDriverArchitecture(version) {
  var platform, type = '.tar.gz';

  if (compareVersions(version, '0.9.0') < 0) {
    type = '.gz';
  }
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

function compareVersions (v1, v2) {
  function split (flag, version) {
    var result = [];
    if (flag) {
      var tail = version.split('-')[1];
      var _version = version.split('-')[0];
      result = _version.split('.');
      tail = tail.split('.');
      result = result.concat(tail);
    } else {
      result = version.split('.');
    }
    return result;
  }

  function convertToNumber (arr) {
    return arr.map(function (el) {
      return isNaN(el) ? el : parseInt(el);
    });
  }

  var flag1 = v1.indexOf('-') > -1 ? true : false;
  var flag2 = v2.indexOf('-') > -1 ? true : false;
  var arr1 = split(flag1, v1);
  var arr2 = split(flag2, v2);
  arr1 = convertToNumber(arr1);
  arr2 = convertToNumber(arr2);
  var len = Math.max(arr1.length, arr2.length);
  for (var i = 0; i < len; i ++) {
    if (arr1[i] === undefined) {
      return -1
    } else if (arr2[i] === undefined) {
      return 1
    }
    if (arr1[i] > arr2[i]) {
      return 1
    } else if(arr1[i] < arr2[i]) {
      return -1
    }
  }
  return 0;
}

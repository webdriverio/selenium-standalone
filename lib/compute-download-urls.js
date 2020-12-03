module.exports = computeDownloadUrls;

const got = require('got');
const util = require('util');

const urls = {
  selenium: '%s/%s/selenium-server-standalone-%s.jar',
  chrome: '%s/%s/chromedriver_%s.zip',
  ie: '%s/%s/IEDriverServer_%s_%s.zip',
  firefox: '%s/%s/%s-%s-%s',
  chromiumedge: '%s/%s/edgedriver_%s.zip',
};

let mac32;

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
async function computeDownloadUrls(opts) {
  // 2.44.0 => 2.44
  // 2.44.0 would be `patch`, 2.44 `minor`, 2 `major` as per semver

  const downloadUrls = {
    selenium:
      opts.seleniumFullURL ||
      util.format(
        urls.selenium,
        opts.seleniumBaseURL,
        opts.seleniumVersion.replace(/(\d+\.\d+)\.\d+/, '$1'),
        opts.seleniumVersion
      ),
  };
  if (opts.drivers.chrome) {
    await resolveLatestVersion(opts, 'chrome', opts.drivers.chrome.baseURL + '/LATEST_RELEASE');
    if (opts.drivers.chrome.version < 2.23) {
      mac32 = true;
    }
    downloadUrls.chrome =
      opts.drivers.chrome.fullURL ||
      util.format(
        urls.chrome,
        opts.drivers.chrome.baseURL,
        opts.drivers.chrome.version,
        getChromeDriverArchitecture(opts.drivers.chrome.version, opts.drivers.chrome.arch)
      );
  }
  if (opts.drivers.ie) {
    downloadUrls.ie =
      opts.drivers.ie.fullURL ||
      util.format(
        urls.ie,
        opts.drivers.ie.baseURL,
        opts.drivers.ie.version.slice(0, opts.drivers.ie.version.lastIndexOf('.')),
        getIeDriverArchitecture(opts.drivers.ie.arch),
        opts.drivers.ie.version
      );
  }
  if (opts.drivers.firefox) {
    await resolveLatestVersion(opts, 'firefox', 'https://api.github.com/repos/mozilla/geckodriver/releases/latest');
    downloadUrls.firefox =
      opts.drivers.firefox.fullURL ||
      util.format(
        urls.firefox,
        opts.drivers.firefox.baseURL,
        getFirefoxDriverDirectory(opts.drivers.firefox.version),
        getFirefoxDriverName(opts.drivers.firefox.version),
        getFirefoxDriverVersionForUrl(opts.drivers.firefox.version),
        getFirefoxDriverArchitecture(opts.drivers.firefox.version, opts.drivers.firefox.arch)
      );
  }
  if (opts.drivers.edge) {
    downloadUrls.edge = opts.drivers.edge.fullURL || getEdgeDriverUrl(opts.drivers.edge.version);
  }
  if (opts.drivers.chromiumedge) {
    await resolveLatestVersion(
      opts,
      'chromiumedge',
      'https://msedgewebdriverstorage.blob.core.windows.net/edgewebdriver/LATEST_STABLE'
    );
    downloadUrls.chromiumedge =
      opts.drivers.chromiumedge.fullURL ||
      util.format(
        urls.chromiumedge,
        opts.drivers.chromiumedge.baseURL,
        opts.drivers.chromiumedge.version,
        getChromiumEdgeDriverArchitecture(opts.drivers.chromiumedge.arch)
      );
  }

  return downloadUrls;
}

function getChromeDriverArchitecture(version, wantedArchitecture) {
  let platform;

  if (process.platform === 'linux') {
    platform = getLinuxChromeDriverArchitecture(version, wantedArchitecture);
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
  let platform;

  if (wanted === 'ia32') {
    platform = 'Win32';
  } else {
    platform = 'x64';
  }

  return platform;
}

// The 0.3.0 version was release in a 'v' less directory :
// https://github.com/mozilla/geckodriver/releases/download/0.3.0/wires-0.3.0-linux64.gz
// Others has 'v' :
// https://github.com/mozilla/geckodriver/releases/download/v0.4.0/wires-0.4.0-linux64.gz
function getFirefoxDriverDirectory(version) {
  const vLessVersions = ['0.3.0'];

  if (vLessVersions.indexOf(version) !== -1) {
    return version;
  }
  return 'v' + version;
}

// Since 0.8.0, the driver name is 'geckodriver' aka Marionette
// Before, the diver was 'wires'
function getFirefoxDriverName(version) {
  if (compareVersions(version, '0.8.0') >= 0) {
    return 'geckodriver';
  }
  return 'wires';
}

// Since 0.9, version in filename is prefixed by a 'v'
// Before, only windows for versions 0.5.0 0.7.1 and 0.8.0 had a 'v'
function getFirefoxDriverVersionForUrl(version) {
  if (compareVersions(version, '0.9.0') >= 0) {
    return 'v' + version;
  }
  if (process.platform === 'win32' && ['0.5.0', '0.7.1', '0.8.0'].indexOf(version) !== -1) {
    return 'v' + version;
  }
  return version;
}

function getFirefoxDriverArchitecture(version, wantedArchitecture) {
  let extension = '.tar.gz';

  if (process.arch === 'arm') {
    return 'arm7hf.tar.gz';
  }
  // Before 0.9, drivers were a standalone file, gzipped
  if (compareVersions(version, '0.9.0') < 0) {
    extension = '.gz';
  }
  switch (process.platform) {
    case 'linux':
      return getLinuxFirefoxDriverArchitecture(version, extension, wantedArchitecture);
    case 'darwin':
      return getMacFirefoxDriverArchitecture(version, extension);
    case 'win32':
      return getWindowsFirefoxDriverArchitecture(version, wantedArchitecture);
    default:
      throw new Error('No Firefox driver is available for platform "' + process.platform + '"');
  }
}

function getLinuxChromeDriverArchitecture(version, wantedArchitecture) {
  // Since 2.34, chromdriver support was dropped for linux 32
  if (compareVersions(version, '2.34') >= 0 && wantedArchitecture !== 'x64') {
    throw new Error('Only x64 architecture is available for chromdriver >= 2.34');
  }

  return 'linux' + (wantedArchitecture === 'x64' ? '64' : '32');
}

function getLinuxFirefoxDriverArchitecture(version, extension, wantedArchitecture) {
  // Since 0.11.0, there is linux32 and linux64
  if (compareVersions(version, '0.11.0') >= 0) {
    const arch = wantedArchitecture === 'x64' ? '64' : '32';
    return 'linux' + arch + extension;
  }
  // Below this version, only x64 is available
  if (wantedArchitecture && wantedArchitecture !== 'x64') {
    throw new Error('Only x64 architecture is available for Firefox < 0.11.0');
  }
  return 'linux64' + extension;
}

function getMacFirefoxDriverArchitecture(version, extension) {
  // >= 0.10.0 is named 'macos'
  if (compareVersions(version, '0.10.0') >= 0) {
    return 'macos' + extension;
  }
  // 0.9.0 is names 'mac'
  if (version === '0.9.0') {
    return 'mac' + extension;
  }
  // 0.6.2 to 0.8.0 are named 'OSX'
  if (compareVersions(version, '0.6.2') >= 0 && compareVersions(version, '0.8.2') <= 0) {
    return 'OSX' + extension;
  }
  // All <= 0.6.0 is named 'osx'
  return 'osx' + extension;
}

function getWindowsFirefoxDriverArchitecture(version, wantedArchitecture) {
  let arch = '32';

  if (wantedArchitecture && wantedArchitecture.substr(-2) === '64') {
    arch = '64';
  }
  // Since 0.11.0, there is win32 and win64
  if (compareVersions(version, '0.11.0') >= 0) {
    return 'win' + arch + '.zip';
  }
  // 0.9.0 and 0.10.0 only have win64
  if (version === '0.9.0' || version === '0.10.0') {
    if (wantedArchitecture && arch !== '64') {
      throw new Error('Only x64 architecture is available for Firefox 0.9.0 and 0.10.0');
    }
    return 'win64.zip';
  }
  // Below there is only win32
  if (wantedArchitecture && arch !== '32') {
    throw new Error('Only 32 bits architectures are available for Firefox <= 0.8.0');
  }
  // 0.8.0 & 0.7.1 are named 'win32'
  if (version === '0.8.0' || version === '0.7.1') {
    return 'win32.zip';
  }
  // Below is named 'win' except for 0.3.0 which is named 'windows'
  if (version === '0.3.0') {
    return 'windows.zip';
  }
  return 'win.zip';
}

const microsoftEdgeReleases = require('./microsoft-edge-releases');

function getEdgeDriverUrl(version) {
  const release = microsoftEdgeReleases[version];
  if (!release) {
    throw new Error(
      'Invalid Microsoft Edge Web Driver version see https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/#downloads'
    );
  }

  return release.url;
}

function getChromiumEdgeDriverArchitecture(wantedArchitecture) {
  let platform;

  if (process.platform === 'linux') {
    platform = getLinuxChromiumEdgeDriverArchitecture(wantedArchitecture);
  } else if (process.platform === 'darwin') {
    platform = getMacChromiumEdgeDriverArchitecture(wantedArchitecture);
  } else if (wantedArchitecture === 'x32') {
    platform = 'win32';
  } else {
    platform = 'win64';
  }

  return platform;
}

function getLinuxChromiumEdgeDriverArchitecture(wantedArchitecture) {
  // chromium edge supports linux 64 only
  if (wantedArchitecture !== 'x64') {
    throw new Error('Only x64 architecture is available for chroimum edge driver for linux');
  }

  return 'linux64';
}

function getMacChromiumEdgeDriverArchitecture(wantedArchitecture) {
  // chromium edge supports mac 64 only
  if (wantedArchitecture !== 'x64') {
    throw new Error('Only x64 architecture is available for chroimum edge driver for mac');
  }

  return 'mac64';
}

function compareVersions(v1, v2) {
  function split(flag, version) {
    let result = [];
    if (flag) {
      let tail = version.split('-')[1];
      const _version = version.split('-')[0];
      result = _version.split('.');
      tail = tail.split('.');
      result = result.concat(tail);
    } else {
      result = version.split('.');
    }
    return result;
  }

  function convertToNumber(arr) {
    return arr.map((el) => {
      return Number.isNaN(el) ? el : parseInt(el, 10);
    });
  }

  const flag1 = v1.indexOf('-') > -1;
  const flag2 = v2.indexOf('-') > -1;
  let arr1 = split(flag1, v1);
  let arr2 = split(flag2, v2);
  arr1 = convertToNumber(arr1);
  arr2 = convertToNumber(arr2);
  const len = Math.max(arr1.length, arr2.length);
  for (let i = 0; i < len; i++) {
    if (arr1[i] === undefined) {
      return -1;
    }
    if (arr2[i] === undefined) {
      return 1;
    }
    if (arr1[i] > arr2[i]) {
      return 1;
    }
    if (arr1[i] < arr2[i]) {
      return -1;
    }
  }
  return 0;
}

async function resolveLatestVersion(opts, browserDriver, url) {
  if (opts.drivers[browserDriver].version === 'latest') {
    try {
      if (browserDriver === 'firefox') {
        if (await getLatestGeckodriver(opts, browserDriver, url)) {
          return true;
        }
      } else if (await getLatestChromium(opts, browserDriver, url)) {
        return true;
      }
    } catch (_) {
      // eslint-disable-next-line no-param-reassign
    }
    // eslint-disable-next-line no-param-reassign
    opts.drivers[browserDriver].version = opts.drivers[browserDriver].fallbackVersion;
  }
}

async function getLatestChromium(opts, browserDriver, url) {
  const response = await got(url, { timeout: 10000 });
  // eslint-disable-next-line no-param-reassign
  opts.drivers[browserDriver].version = response.body
    // edgewebdriver latest version file contains invalid characters
    .replace(/\r|\n/g, '')
    .replace(/[^\d|.]/g, '');
  return true;
}

async function getLatestGeckodriver(opts, browserDriver, url) {
  const response = await got(url, { timeout: 10000, responseType: 'json' });
  if (typeof response.body.name === 'string') {
    // eslint-disable-next-line no-param-reassign
    opts.drivers[browserDriver].version = response.body.name;
    return true;
  }
}

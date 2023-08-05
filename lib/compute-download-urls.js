module.exports = { computeDownloadUrls, resolveDownloadPath, getLastChromedriverVersionFromMajor, getLatestChromium };

const got = require('got');
const util = require('util');
const { isSelenium4 } = require('./isSelenium4');
const { detectBrowserPlatform, resolveBuildId } = require('@puppeteer/browsers');
const { validateMajorVersionPrefix, getVersionWithZeroedPatchPart } = require('./validation');
const axios = require('axios');

const urls = {
  selenium: '%s/%s/selenium-server-standalone-%s.jar',
  seleniumV4: '%s/%s/selenium-server-%s.jar',
  chrome: '%s/%s/chromedriver_%s.zip',
  ie: '%s/%s/IEDriverServer_%s_%s.zip',
  firefox: '%s/%s/%s-%s-%s',
  chromiumedge: '%s/%s/edgedriver_%s.zip',
};

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
async function computeDownloadUrls(options) {
  const opts = Object.assign({}, options);

  const downloadUrls = {
    selenium:
      opts.seleniumFullURL ||
      util.format(
        isSelenium4(opts.seleniumVersion) ? urls.seleniumV4 : urls.selenium,
        opts.seleniumBaseURL,
        isSelenium4(opts.seleniumVersion)
          ? `selenium-${getVersionWithZeroedPatchPart(opts.seleniumVersion)}`
          : `selenium-${opts.seleniumVersion}`,
        opts.seleniumVersion
      ),
  };
  if (opts.drivers.chrome) {
    if (opts.drivers.chrome.version === 'latest' && !opts.drivers.chrome.fullURL) {
      opts.drivers.chrome.version = await resolveBuildId(
        'chromedriver',
        detectBrowserPlatform(),
        opts.drivers.chrome.channel ? opts.drivers.chrome.channel : 'stable'
      );
      downloadUrls.chrome = resolveDownloadUrl(
        detectBrowserPlatform(),
        opts.drivers.chrome.version,
        opts.drivers.chrome.baseURL
      );
    } else if (
      validateMajorVersionPrefix(opts.drivers.chrome.version) &&
      Number(validateMajorVersionPrefix(opts.drivers.chrome.version)) > 114 &&
      !opts.drivers.chrome.fullURL
    ) {
      const lastVersionFromMajor = opts.drivers.chrome.major
        ? opts.drivers.chrome.major
        : await getLastChromedriverVersionFromMajor(opts.drivers.chrome.version);

      if (lastVersionFromMajor) {
        const url = lastVersionFromMajor.downloads.chrome
          .map((m) => {
            if (m.platform === detectBrowserPlatform()) {
              return m.url;
            }
          })
          .filter((f) => f !== undefined);

        if (url.length) {
          downloadUrls.chrome = url[0];
          opts.drivers.chrome.version = lastVersionFromMajor.version;
        } else {
          console.log(`Url for the latest for major:${url} fallback to latest`);

          opts.drivers.chrome.version = await resolveBuildId(
            'chromedriver',
            detectBrowserPlatform(),
            opts.drivers.chrome.channel ? opts.drivers.chrome.channel : 'stable'
          );
          downloadUrls.chrome = resolveDownloadUrl(
            detectBrowserPlatform(),
            opts.drivers.chrome.version,
            opts.drivers.chrome.baseURL
          );
        }
      } else {
        console.log(`The latest for major ${opts.drivers.chrome.version}:${lastVersionFromMajor} fallback to latest`);

        opts.drivers.chrome.version = await resolveBuildId(
          'chromedriver',
          detectBrowserPlatform(),
          opts.drivers.chrome.channel ? opts.drivers.chrome.channel : 'stable'
        );
        downloadUrls.chrome = resolveDownloadUrl(
          detectBrowserPlatform(),
          opts.drivers.chrome.version,
          opts.drivers.chrome.baseURL
        );
      }
    } else if (opts.drivers.chrome.fullURL) {
      downloadUrls.chrome = opts.drivers.chrome.fullURL;
    } else {
      opts.drivers.chrome.baseURL = opts.drivers.chrome.baseURL
        ? opts.drivers.chrome.baseURL
        : 'https://chromedriver.storage.googleapis.com';
      await resolveLatestVersion(opts, 'chrome', opts.drivers.chrome.baseURL + '/LATEST_RELEASE');

      downloadUrls.chrome =
        opts.drivers.chrome.fullURL ||
        util.format(
          urls.chrome,
          opts.drivers.chrome.baseURL,
          opts.drivers.chrome.version,
          getChromeDriverArchitecture(opts.drivers.chrome.arch, opts.drivers.chrome.version)
        );
    }
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
        `v${opts.drivers.firefox.version}`,
        'geckodriver',
        `v${opts.drivers.firefox.version}`,
        getFirefoxDriverArchitecture(opts.drivers.firefox.arch)
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
        getChromiumEdgeDriverArchitecture(opts.drivers.chromiumedge.arch, opts.drivers.chromiumedge.version)
      );
  }
  return downloadUrls;
}

function getChromeDriverArchitecture(wantedArchitecture, version) {
  let platform;

  if (process.platform === 'linux') {
    platform = 'linux64';
  } else if (process.platform === 'darwin') {
    if (process.arch === 'arm64') {
      const [major] = version.split('.');
      platform = parseInt(major, 10) > 105 ? 'mac_arm64' : 'mac64_m1';
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

function getFirefoxDriverArchitecture(wantedArchitecture) {
  const extension = '.tar.gz';

  switch (process.platform) {
    case 'linux':
      return getLinuxFirefoxDriverArchitecture(extension, wantedArchitecture);
    case 'darwin':
      return getMacFirefoxDriverArchitecture(extension);
    case 'win32':
      return getWindowsFirefoxDriverArchitecture(wantedArchitecture);
    default:
      throw new Error('No Firefox driver is available for platform "' + process.platform + '"');
  }
}

function getLinuxFirefoxDriverArchitecture(extension, wantedArchitecture = 'x64') {
  const arch = wantedArchitecture === 'x64' ? '64' : '32';
  return 'linux' + arch + extension;
}

function getMacFirefoxDriverArchitecture(extension) {
  return 'macos' + (process.arch === 'arm64' ? '-aarch64' : '') + extension;
}

function getWindowsFirefoxDriverArchitecture(wantedArchitecture = '64') {
  const arch = wantedArchitecture.substr(-2) === '64' ? '64' : '32';

  return `win${arch}.zip`;
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

function getChromiumEdgeDriverArchitecture(wantedArchitecture, version) {
  let platform;

  if (process.platform === 'linux') {
    platform = 'linux64';
  } else if (process.platform === 'darwin') {
    if (process.arch === 'arm64') {
      const [major] = version.split('.');
      platform = parseInt(major, 10) > 104 ? 'mac64_m1' : 'mac64';
    } else {
      platform = 'mac64';
    }
  } else if (wantedArchitecture === 'x32') {
    platform = 'win32';
  } else {
    platform = 'win64';
  }

  return platform;
}

async function chromiumEdgeBundleAvailable(opts) {
  const url = util.format(
    urls.chromiumedge,
    opts.drivers.chromiumedge.baseURL,
    opts.drivers.chromiumedge.version,
    getChromiumEdgeDriverArchitecture(opts.drivers.chromiumedge.platform)
  );
  try {
    await got.head(url, { timeout: 10000 });
  } catch (_) {
    return false;
  }
  return true;
}

async function resolveLatestVersion(opts, browserDriver, url) {
  if (opts.drivers[browserDriver].version === 'latest' && browserDriver !== 'chrome') {
    try {
      if (browserDriver === 'firefox') {
        if (await getLatestGeckodriver(opts, browserDriver, url)) {
          return true;
        }
        /**
         * it seems that linux releases are not for every version
         */
      } else if (browserDriver === 'chromiumedge') {
        if (await getLatestChromium(opts, browserDriver, url)) {
          if (await chromiumEdgeBundleAvailable(opts)) {
            return true;
          }
        }
      }
    } catch (_) {
      // eslint-disable-next-line no-empty
    }
    // eslint-disable-next-line no-param-reassign
    opts.drivers[browserDriver].version = opts.drivers[browserDriver].fallbackVersion;
  } else if (/^(\d{3})\.\d+\.\d+/.test(opts.drivers.chrome.version) && browserDriver === 'chrome') {
    if (await getLatestChromium(opts, browserDriver, url)) {
      return true;
    }
  }
}

async function getLatestChromium(opts, browserDriver, url) {
  try {
    const response = await got(url, { timeout: 10000 });
    // edgewebdriver latest version file contains invalid characters
    const version = response.body.replace(/\r|\n/g, '').replace(/[^\d|.]/g, '');

    // eslint-disable-next-line no-param-reassign
    opts.drivers[browserDriver].version = version;
    return true;
  } catch {
    return false;
  }
}

async function getLatestGeckodriver(opts, browserDriver, url) {
  const response = await got(url, { timeout: 10000, responseType: 'json' });
  if (typeof response.body.name === 'string' && response.body.name) {
    // eslint-disable-next-line no-param-reassign
    opts.drivers[browserDriver].version = response.body.name;
    return true;
  }
}

function resolveDownloadUrl(
  platform,
  buildId,
  baseUrl = 'https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing'
) {
  return `${baseUrl}/${resolveDownloadPath(platform, buildId).join('/')}`;
}

function folder(platform) {
  switch (platform) {
    case 'linux':
      return 'linux64';
    case 'mac':
      return 'mac-arm64';
    case 'mac_arm':
      return 'mac-x64';
    case 'win32':
      return 'win32';
    case 'win64':
      return 'win64';
  }
}

function resolveDownloadPath(platform, buildId) {
  return [buildId, folder(platform), `chromedriver-${folder(platform)}.zip`];
}

async function getLastChromedriverVersionFromMajor(version) {
  const response = await axios({
    method: 'get',
    url: 'https://googlechromelabs.github.io/chrome-for-testing/known-good-versions-with-downloads.json',
    responseType: 'json',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const versionsWithMajor = response.data.versions.filter(
    (f) =>
      validateMajorVersionPrefix(f.version) === validateMajorVersionPrefix(version) && 'chromedriver' in f.downloads
  );
  versionsWithMajor
    .sort((version1, version2) => {
      return version1.version.localeCompare(version2.version, undefined, { numeric: true, sensitivity: 'base' });
    })
    .reverse();

  return versionsWithMajor.length ? versionsWithMajor[0] : null;
}

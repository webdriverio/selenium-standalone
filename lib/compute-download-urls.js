const { default: got } = require('got');
const util = require('util');
const { isSelenium4 } = require('./isSelenium4');
const { validateMajorVersionPrefix, getVersionWithZeroedPatchPart } = require('./validation');
const {
  detectBrowserPlatformCustom,
  getArhType,
  getChromiumEdgeDriverArchitectureOld,
  getChromeDriverArchitectureOld,
  getIeDriverArchitectureOld,
  getFirefoxDriverArchitectureOld,
} = require('./platformDetection');

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
 * @param {Object} opts
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
      const { latestVersion, url } = await getPackageInfo(
        opts.drivers.chrome.version,
        opts.drivers.chrome.arch,
        opts.drivers.chrome.channel,
        opts.drivers.chrome.baseURL
      );
      opts.drivers.chrome.version = latestVersion;
      downloadUrls.chrome = url;
    } else if (
      validateMajorVersionPrefix(opts.drivers.chrome.version) &&
      Number(validateMajorVersionPrefix(opts.drivers.chrome.version)) > 114 &&
      !opts.drivers.chrome.fullURL
    ) {
      const lastVersionFromMajor = opts.drivers.chrome.major
        ? opts.drivers.chrome.major
        : await getLastChromedriverVersionFromMajor(opts.drivers.chrome.version);

      if (
        lastVersionFromMajor &&
        'downloads' in lastVersionFromMajor &&
        'chromedriver' in lastVersionFromMajor.downloads
      ) {
        const url = lastVersionFromMajor.downloads.chromedriver
          .map((m) => {
            if (m.platform === getArhType(detectBrowserPlatformCustom(opts.drivers.chrome.arch))) {
              return m.url;
            }
          })
          .filter((f) => f !== undefined);

        if (url.length) {
          downloadUrls.chrome = url[0];
          opts.drivers.chrome.version = lastVersionFromMajor.version;
        } else {
          console.log(`Wrong url: ${JSON.stringify(url)} fallback to latest`);

          const { latestVersion, packageUrl } = await getPackageInfo(
            'latest',
            opts.drivers.chrome.arch,
            opts.drivers.chrome.channel,
            opts.drivers.chrome.baseURL
          );
          opts.drivers.chrome.version = latestVersion;
          downloadUrls.chrome = packageUrl;
        }
      } else {
        console.log(`Wrong the latest from major fallback to latest`);

        const { latestVersion, url } = await getPackageInfo(
          'latest',
          opts.drivers.chrome.arch,
          opts.drivers.chrome.channel,
          opts.drivers.chrome.baseURL
        );
        opts.drivers.chrome.version = latestVersion;
        downloadUrls.chrome = url;
      }
    } else if (opts.drivers.chrome.fullURL) {
      downloadUrls.chrome = opts.drivers.chrome.fullURL;
    } else {
      const oldVersion = validateMajorVersionPrefix(opts.drivers.chrome.version);

      opts.drivers.chrome.baseURL =
        opts.drivers.chrome.baseURL && !opts.drivers.chrome.baseURL.includes('edgedl.me.gvt1.com')
          ? opts.drivers.chrome.baseURL
          : 'https://chromedriver.storage.googleapis.com';

      await resolveLatestVersion(
        opts,
        'chrome',
        oldVersion
          ? opts.drivers.chrome.baseURL + `/LATEST_RELEASE_${oldVersion}`
          : opts.drivers.chrome.baseURL + '/LATEST_RELEASE'
      );

      downloadUrls.chrome =
        opts.drivers.chrome.fullURL ||
        util.format(
          urls.chrome,
          opts.drivers.chrome.baseURL,
          opts.drivers.chrome.version,
          getChromeDriverArchitectureOld(opts.drivers.chrome.arch, opts.drivers.chrome.version)
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
        getIeDriverArchitectureOld(opts.drivers.ie.arch),
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
        getFirefoxDriverArchitectureOld(opts.drivers.firefox.arch)
      );
  }
  if (opts.drivers.edge) {
    downloadUrls.edge = opts.drivers.edge.fullURL || getEdgeDriverUrl(opts.drivers.edge.version);
  }
  if (opts.drivers.chromiumedge) {
    await resolveLatestVersion(opts, 'chromiumedge', 'https://msedgedriver.azureedge.net/LATEST_STABLE');
    downloadUrls.chromiumedge =
      opts.drivers.chromiumedge.fullURL ||
      util.format(
        urls.chromiumedge,
        opts.drivers.chromiumedge.baseURL,
        opts.drivers.chromiumedge.version,
        getChromiumEdgeDriverArchitectureOld(opts.drivers.chromiumedge.arch, opts.drivers.chromiumedge.version)
      );
  }
  return downloadUrls;
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

async function chromiumEdgeBundleAvailable(opts) {
  const url = util.format(
    urls.chromiumedge,
    opts.drivers.chromiumedge.baseURL,
    opts.drivers.chromiumedge.version,
    getChromiumEdgeDriverArchitectureOld(opts.drivers.chromiumedge.platform, opts.drivers.chromiumedge.version)
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
  } else if (browserDriver === 'chrome' && !/^(\d{2,3})\.\d+\.\d+.\d+/.test(opts.drivers.chrome.version)) {
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

function resolveDownloadUrl(platform, buildId, baseUrl = 'https://storage.googleapis.com/chrome-for-testing-public') {
  return `${baseUrl}/${resolveDownloadPath(platform, buildId).join('/')}`;
}

function resolveDownloadPath(platform, buildId) {
  return [buildId, getArhType(platform), `chromedriver-${getArhType(platform)}.zip`];
}

async function getLastChromedriverVersionFromMajor(version) {
  const response = await got({
    method: 'get',
    url: 'https://googlechromelabs.github.io/chrome-for-testing/known-good-versions-with-downloads.json',
    responseType: 'json',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const versionsWithMajor = response.body.versions.filter(
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

async function getLatestChromeVersion(possibleChanel) {
  const response = await got({
    method: 'get',
    url: 'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json',
    responseType: 'json',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const channel = Object.keys(response.body.channels).find((i) => i.toLowerCase() === possibleChanel.toLowerCase());

  try {
    return response.body.channels[channel].version;
  } catch (err) {
    console.log();
    throw new Error(`channel can't be - ${possibleChanel}, possible only Stable, Beta, Dev, Canary`);
  }
}

async function getPackageInfo(version, arh, channel, baseUrl) {
  let latestVersion = '';
  let possibleChannel = 'stable';

  if (channel) {
    possibleChannel = channel;
  }
  if (!version || version === 'latest') {
    latestVersion = await getLatestChromeVersion(possibleChannel);
  } else {
    latestVersion = await getLastChromedriverVersionFromMajor(version);
  }
  const url = resolveDownloadUrl(detectBrowserPlatformCustom(arh), latestVersion, baseUrl);

  return { latestVersion, url };
}

module.exports = { computeDownloadUrls, resolveDownloadPath, getLastChromedriverVersionFromMajor, getLatestChromium };

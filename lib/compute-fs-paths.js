const path = require('path');
const { getLastChromedriverVersionFromMajor, getLatestChromium } = require('./compute-download-urls');
const { validateMajorVersionPrefix } = require('./validation');
const { detectBrowserPlatformCustom } = require('./platformDetection');

const basePath = path.join(__dirname, '..', '.selenium');

const computeFsPaths = async (options) => {
  let fsPaths = {};
  const opts = Object.assign({}, options);
  opts.basePath = opts.basePath || basePath;
  if (opts.drivers.chrome) {
    if (
      opts.drivers.chrome.version !== 'latest' &&
      Number(validateMajorVersionPrefix(opts.drivers.chrome.version)) > 114
    ) {
      const version = await getLastChromedriverVersionFromMajor(opts.drivers.chrome.version);
      opts.drivers.chrome.major = version;
      opts.drivers.chrome.version = version ? version.version : 'latest';
    } else if (
      opts.drivers.chrome.version !== 'latest' &&
      Number(validateMajorVersionPrefix(opts.drivers.chrome.version)) <= 114
    ) {
      await getLatestChromium(
        opts,
        'chrome',
        validateMajorVersionPrefix(opts.drivers.chrome.version)
          ? `https://chromedriver.storage.googleapis.com/LATEST_RELEASE_${validateMajorVersionPrefix(
              opts.drivers.chrome.version
            )}`
          : 'https://chromedriver.storage.googleapis.com/LATEST_RELEASE'
      );
    }
    fsPaths.chrome = {
      installPath: path.join(
        opts.basePath,
        'chromedriver',
        `${opts.drivers.chrome.version}-${detectBrowserPlatformCustom(opts.drivers.chrome.arch)}`,
        'chromedriver'
      ),
      requireChmod: true,
    };
  }

  if (opts.drivers.ie) {
    fsPaths.ie = {
      installPath: path.join(
        opts.basePath,
        'iedriver',
        `${opts.drivers.ie.version}-${detectBrowserPlatformCustom(opts.drivers.ie.arch)}`,
        'IEDriverServer'
      ),
    };
  }

  if (opts.drivers.edge) {
    fsPaths.edge = {
      installPath: path.join(opts.basePath, 'edgedriver', opts.drivers.edge.version, 'MicrosoftEdgeDriver.exe'),
    };
  }

  if (opts.drivers.firefox) {
    fsPaths.firefox = {
      installPath: path.join(
        opts.basePath,
        'geckodriver',
        `${opts.drivers.firefox.version}-${detectBrowserPlatformCustom(opts.drivers.firefox.arch)}`,
        'geckodriver'
      ),
      requireChmod: true,
    };
  }

  if (opts.drivers.chromiumedge) {
    fsPaths.chromiumedge = {
      installPath: path.join(
        opts.basePath,
        'chromiumedgedriver',
        `${opts.drivers.chromiumedge.version}-${detectBrowserPlatformCustom(opts.drivers.chromiumedge.arch)}`,
        'msedgedriver'
      ),
      requireChmod: true,
    };
  }

  fsPaths.selenium = {
    installPath: path.join(opts.basePath, 'selenium-server', opts.seleniumVersion, 'selenium-server.jar'),
  };

  fsPaths = Object.keys(fsPaths).reduce(function computeDownloadPath(acc, name) {
    let downloadPath;

    if (name === 'selenium' || name === 'edge') {
      downloadPath = acc[name].installPath;
    } else if (name === 'firefox' && process.platform !== 'win32') {
      downloadPath = acc[name].installPath + '.gz';
    } else {
      downloadPath = acc[name].installPath + '.zip';

      if (process.platform === 'win32') {
        acc[name].installPath = `${acc[name].installPath}.exe`;
      }
    }
    acc[name].downloadPath = downloadPath;
    return acc;
  }, fsPaths);

  return fsPaths;
};

module.exports = computeFsPaths;

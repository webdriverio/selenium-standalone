const assert = require('assert');
const merge = require('lodash.merge');
const got = require('got');

const defaultConfig = require('../lib/default-config')();

let computeDownloadUrls;
let computedUrls;
let opts = {
  seleniumVersion: defaultConfig.version,
  seleniumBaseURL: defaultConfig.baseURL,
  drivers: defaultConfig.drivers,
};

async function doesDownloadExist(url) {
  const downloadStream = got.stream(url, { timeout: 15000, retry: 0 });
  return new Promise((resolve, reject) => {
    downloadStream
      .once('response', () => resolve())
      .once('downloadProgress', () => {
        downloadStream.destroy();
      })
      .once('error', (err) => {
        console.error(err);
        reject(new Error('Error requesting ' + url + ' - ' + err.message));
      });
  });
}

/**
 * Tests to ensure that all the values listed in `default-config.js`
 * are actually downloadable.
 */
describe('default-downloads', function () {
  this.timeout(60000);
  // Allow tests to mock `process.platform`
  before(function () {
    this.originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
  });
  after(function () {
    Object.defineProperty(process, 'platform', this.originalPlatform);
  });

  // Ensure that any internal state of the module is clean for each test
  beforeEach(() => {
    computeDownloadUrls = require('../lib/compute-download-urls');
  });
  afterEach(() => {
    delete require.cache[require.resolve('../lib/compute-download-urls')];
  });

  describe('selenium-jar', () => {
    it('selenium-jar download exists', async () => {
      computedUrls = await computeDownloadUrls(opts);
      await doesDownloadExist(computedUrls.selenium);
    });
  });

  if (process.version.startsWith('v14.')) {
    describe('ie', () => {
      before(() => {
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        });
      });

      it('ia32 download exists', async () => {
        opts = merge(opts, {
          drivers: {
            ie: {
              arch: 'ia32',
            },
          },
        });

        computedUrls = await computeDownloadUrls(opts);

        assert(computedUrls.ie.indexOf('Win32') > 0);
        await doesDownloadExist(computedUrls.ie);
      });

      it('x64 download exists', async () => {
        opts = merge(opts, {
          drivers: {
            ie: {
              arch: 'x64',
            },
          },
        });

        computedUrls = await computeDownloadUrls(opts);

        assert(computedUrls.ie.indexOf('x64') > 0);
        await doesDownloadExist(computedUrls.ie);
      });
    });

    describe('edge', () => {
      before(() => {
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        });
      });

      const releases = require('../lib/microsoft-edge-releases');

      Object.keys(releases).forEach((version) => {
        it('version `' + version + '` download exists', async () => {
          opts = merge(opts, {
            drivers: {
              edge: {
                version: version,
              },
            },
          });

          computedUrls = await computeDownloadUrls(opts);

          assert.strictEqual(computedUrls.edge, releases[version].url);
          await doesDownloadExist(computedUrls.edge);
        });
      });
    });
  }

  describe('chrome', () => {
    describe('linux', () => {
      before(() => {
        Object.defineProperty(process, 'platform', {
          value: 'linux',
        });
      });

      it('x64 download exists', async () => {
        opts = merge(opts, {
          drivers: {
            chrome: {
              arch: 'x64',
            },
          },
        });

        computedUrls = await computeDownloadUrls(opts);

        assert(computedUrls.chrome.indexOf('linux64') > 0);
        await doesDownloadExist(computedUrls.chrome);
      });
    });

    describe('mac', () => {
      before(() => {
        Object.defineProperty(process, 'platform', {
          value: 'darwin',
        });
      });

      it('x64 download exists', async () => {
        computedUrls = await computeDownloadUrls(opts);

        assert(computedUrls.chrome.indexOf('mac_arm64') > 0);
        await doesDownloadExist(computedUrls.chrome);
      });
    });

    describe('win', () => {
      before(() => {
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        });
      });

      // No x64 for latest chromedriver on win

      it('x32 download exists', async () => {
        computedUrls = await computeDownloadUrls(opts);

        assert(computedUrls.chrome.indexOf('win32') > 0);
        await doesDownloadExist(computedUrls.chrome);
      });
    });
  });

  describe('firefox', () => {
    describe('linux', () => {
      before(() => {
        Object.defineProperty(process, 'platform', {
          value: 'linux',
        });
      });

      it('x64 download exists', async () => {
        opts = merge(opts, {
          drivers: {
            firefox: {
              arch: 'x64',
            },
          },
        });

        computedUrls = await computeDownloadUrls(opts);

        assert(computedUrls.firefox.indexOf('linux64') > 0);
        await doesDownloadExist(computedUrls.firefox);
      });
    });

    describe('mac', () => {
      before(() => {
        Object.defineProperty(process, 'platform', {
          value: 'darwin',
        });
      });

      // No difference between arch for latest firefox driver on mac
      it('download exists', async () => {
        computedUrls = await computeDownloadUrls(opts);

        assert(computedUrls.firefox.indexOf('mac') > 0);
        await doesDownloadExist(computedUrls.firefox);
      });
    });

    describe('win', () => {
      before(() => {
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        });
      });

      it('ia32 download exists', async () => {
        opts = merge(opts, {
          drivers: {
            firefox: {
              arch: 'ia32',
            },
          },
        });

        computedUrls = await computeDownloadUrls(opts);

        assert(computedUrls.firefox.indexOf('win32') > 0);
        await doesDownloadExist(computedUrls.firefox);
      });

      it('x64 download exists', async () => {
        opts = merge(opts, {
          drivers: {
            firefox: {
              arch: 'x64',
            },
          },
        });

        computedUrls = await computeDownloadUrls(opts);

        assert(computedUrls.firefox.indexOf('win64') > 0);
        await doesDownloadExist(computedUrls.firefox);
      });
    });
  });
});

const assert = require('assert');
const merge = require('lodash.merge');
const got = require('got');

const defaultConfig = require('../lib/default-config');

let computeDownloadUrls;
let computedUrls;
let opts = {
  seleniumVersion: defaultConfig.version,
  seleniumBaseURL: defaultConfig.baseURL,
  drivers: defaultConfig.drivers,
};

function doesDownloadExist(url, cb) {
  const downloadStream = got
    .stream(url, { timeout: 5000, retry: 0 })
    .once('response', () => cb())
    .once('downloadProgress', () => {
      downloadStream.destroy();
    })
    .once('error', (err) => {
      console.error(err);
      cb(new Error('Error requesting ' + url + ' - ' + err.message));
    });
}

/**
 * Tests to ensure that all the values listed in `default-config.js`
 * are actually downloadable.
 */
describe('default-downloads', () => {
  // Allow tests to mock `process.platform`
  before(function () {
    this.originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
  });
  after(function () {
    Object.defineProperty(process, 'platform', this.originalPlatform);
  });

  // Ensure that any internal state of the module is clean for each test
  beforeEach(function () {
    this.timeout(60000);
    computeDownloadUrls = require('../lib/compute-download-urls');
  });
  afterEach(() => {
    delete require.cache[require.resolve('../lib/compute-download-urls')];
  });

  describe('selenium-jar', () => {
    it('selenium-jar download exists', (done) => {
      computedUrls = computeDownloadUrls(opts);
      doesDownloadExist(computedUrls.selenium, done);
    });
  });

  describe('ie', () => {
    before(function () {
      this.timeout(10000);
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });
    });

    it('ia32 download exists', (done) => {
      opts = merge(opts, {
        drivers: {
          ie: {
            arch: 'ia32',
          },
        },
      });

      computedUrls = computeDownloadUrls(opts);

      assert(computedUrls.ie.indexOf('Win32') > 0);
      doesDownloadExist(computedUrls.ie, done);
    });

    it('x64 download exists', (done) => {
      opts = merge(opts, {
        drivers: {
          ie: {
            arch: 'x64',
          },
        },
      });

      computedUrls = computeDownloadUrls(opts);

      assert(computedUrls.ie.indexOf('x64') > 0);
      doesDownloadExist(computedUrls.ie, done);
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
      it('version `' + version + '` download exists', (done) => {
        opts = merge(opts, {
          drivers: {
            edge: {
              version: version,
            },
          },
        });

        computedUrls = computeDownloadUrls(opts);

        assert.strictEqual(computedUrls.edge, releases[version].url);
        doesDownloadExist(computedUrls.edge, done);
      });
    });
  });

  describe('chrome', () => {
    describe('linux', () => {
      before(() => {
        Object.defineProperty(process, 'platform', {
          value: 'linux',
        });
      });

      // No x32 for latest chromedriver on linux

      it('x64 download exists', (done) => {
        opts = merge(opts, {
          drivers: {
            chrome: {
              arch: 'x64',
            },
          },
        });

        computedUrls = computeDownloadUrls(opts);

        assert(computedUrls.chrome.indexOf('linux64') > 0);
        doesDownloadExist(computedUrls.chrome, done);
      });
    });

    describe('mac', () => {
      before(() => {
        Object.defineProperty(process, 'platform', {
          value: 'darwin',
        });
      });

      // No x32 for latest chromedriver on mac

      it('x64 download exists', (done) => {
        computedUrls = computeDownloadUrls(opts);

        assert(computedUrls.chrome.indexOf('mac64') > 0);
        doesDownloadExist(computedUrls.chrome, done);
      });
    });

    describe('win', () => {
      before(() => {
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        });
      });

      // No x64 for latest chromedriver on win

      it('x32 download exists', (done) => {
        computedUrls = computeDownloadUrls(opts);

        assert(computedUrls.chrome.indexOf('win32') > 0);
        doesDownloadExist(computedUrls.chrome, done);
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

      it('x64 download exists', (done) => {
        opts = merge(opts, {
          drivers: {
            firefox: {
              arch: 'x64',
            },
          },
        });

        computedUrls = computeDownloadUrls(opts);

        assert(computedUrls.firefox.indexOf('linux64') > 0);
        doesDownloadExist(computedUrls.firefox, done);
      });
    });

    describe('mac', () => {
      before(() => {
        Object.defineProperty(process, 'platform', {
          value: 'darwin',
        });
      });

      // No difference between arch for latest firefox driver on mac
      it('download exists', (done) => {
        computedUrls = computeDownloadUrls(opts);

        assert(computedUrls.firefox.indexOf('mac') > 0);
        doesDownloadExist(computedUrls.firefox, done);
      });
    });

    describe('win', () => {
      before(() => {
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        });
      });

      it('ia32 download exists', (done) => {
        opts = merge(opts, {
          drivers: {
            firefox: {
              arch: 'ia32',
            },
          },
        });

        computedUrls = computeDownloadUrls(opts);

        assert(computedUrls.firefox.indexOf('win32') > 0);
        doesDownloadExist(computedUrls.firefox, done);
      });

      it('x64 download exists', (done) => {
        opts = merge(opts, {
          drivers: {
            firefox: {
              arch: 'x64',
            },
          },
        });

        computedUrls = computeDownloadUrls(opts);

        assert(computedUrls.firefox.indexOf('win64') > 0);
        doesDownloadExist(computedUrls.firefox, done);
      });
    });
  });
});

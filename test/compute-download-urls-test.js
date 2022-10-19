const assert = require('assert');
const got = require('got');
const defaults = require('../lib/default-config.js')();

let computeDownloadUrls;

/**
 * Tests for the `computeDownloadUrls` module.
 *
 * NOTE: This does not verify that the module is returning valid URLs that will respond with
 * the desired binary files. Just that the logic contained in the module, specifically for
 * handling when paths formats differ between versions of the same driver.
 */
describe('compute-download-urls', () => {
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

  let opts;

  describe('selenium-jar', () => {
    it('basic version', async () => {
      const actual = await computeDownloadUrls({
        seleniumVersion: '1.0',
        seleniumBaseURL: 'https://localhost',
        drivers: {},
      });

      assert.strictEqual(actual.selenium, 'https://localhost/selenium-1.0/selenium-server-standalone-1.0.jar');
    });

    it('version with patch', async () => {
      const actual = await computeDownloadUrls({
        seleniumVersion: '1.0.1',
        seleniumBaseURL: 'https://localhost',
        drivers: {},
      });

      assert.strictEqual(actual.selenium, 'https://localhost/selenium-1.0.1/selenium-server-standalone-1.0.1.jar');
    });

    it('version with beta string', async () => {
      const actual = await computeDownloadUrls({
        seleniumVersion: '3.0.0-beta2',
        seleniumBaseURL: 'https://localhost',
        drivers: {},
      });

      assert.strictEqual(
        actual.selenium,
        'https://localhost/selenium-3.0.0-beta2/selenium-server-standalone-3.0.0-beta2.jar'
      );
    });

    it('version 4 basic', async () => {
      const actual = await computeDownloadUrls({
        seleniumVersion: '4.1.0',
        seleniumBaseURL: 'https://localhost',
        drivers: {},
      });

      assert.strictEqual(actual.selenium, 'https://localhost/selenium-4.1.0/selenium-server-4.1.0.jar');
    });

    it('version 4 with patch', async () => {
      const actual = await computeDownloadUrls({
        seleniumVersion: '4.1.1',
        seleniumBaseURL: 'https://localhost',
        drivers: {},
      });

      assert.strictEqual(actual.selenium, 'https://localhost/selenium-4.1.0/selenium-server-4.1.1.jar');
    });

    it('version 4 with beta string', async () => {
      const actual = await computeDownloadUrls({
        seleniumVersion: '4.0.0-beta-3',
        seleniumBaseURL: 'https://localhost',
        drivers: {},
      });

      assert.strictEqual(actual.selenium, 'https://localhost/selenium-4.0.0-beta-3/selenium-server-4.0.0-beta-3.jar');
    });

    it('fullURL', async () => {
      const actual = await computeDownloadUrls({
        seleniumVersion: '4.0.0-alpha-7',
        seleniumFullURL:
          'https://selenium-release.storage.googleapis.com/4.0-alpha-7/selenium-server-4.0.0-alpha-7.jar',
        drivers: {},
      });

      assert.strictEqual(
        actual.selenium,
        'https://selenium-release.storage.googleapis.com/4.0-alpha-7/selenium-server-4.0.0-alpha-7.jar'
      );
    });

    it('generates URLs that respond successfully', async function () {
      this.timeout(10000); // HTTP requests take a few seconds

      const versionsExpectedToFail = ['3.150.0'];

      let data;
      try {
        const releasesURL = 'https://api.github.com/repos/SeleniumHQ/selenium/releases';
        data = await got(releasesURL).json();
      } catch (e) {
        // Likely no internet connection so skip but output error to help
        // debug in case something else.
        console.debug(e);
        return this.skip();
      }

      const versions = data.map((release) => release.tag_name.replace(/^selenium-/, ''));
      const checks = versions.map(async (version) => {
        if (versionsExpectedToFail.includes(version)) return;

        const urls = await computeDownloadUrls({
          seleniumVersion: version,
          seleniumBaseURL: defaults.baseURL,
          drivers: {},
        });

        const { statusCode } = await got(urls.selenium, { method: 'HEAD', throwHttpErrors: false });
        assert.strictEqual(statusCode, 200, `URL for Selenium ${version} does not look valid`);
      });
      await Promise.all(checks);
    });
  });

  describe('chrome', () => {
    beforeEach(() => {
      opts = {
        seleniumVersion: '1.0',
        seleniumBaseURL: 'https://localhost',
        drivers: {
          chrome: {},
        },
      };
    });

    describe('linux', () => {
      before(() => {
        Object.defineProperty(process, 'platform', {
          value: 'linux',
        });
      });

      it('x64', async () => {
        opts.drivers.chrome = {
          baseURL: 'https://localhost',
          version: '2.0',
          arch: 'x64',
        };

        const actual = await computeDownloadUrls(opts);
        assert.strictEqual(actual.chrome, 'https://localhost/2.0/chromedriver_linux64.zip');
      });

      it('fullURL', async () => {
        opts.drivers.chrome = {
          fullURL: 'https://chromedriver.storage.googleapis.com/87.0.4280.20/chromedriver_linux64.zip',
          version: 'custom',
        };

        const actual = await computeDownloadUrls(opts);
        assert.strictEqual(
          actual.chrome,
          'https://chromedriver.storage.googleapis.com/87.0.4280.20/chromedriver_linux64.zip'
        );
      });
    });

    describe('mac', () => {
      before(() => {
        Object.defineProperty(process, 'platform', {
          value: 'darwin',
        });

        Object.defineProperty(process, 'arch', {
          value: 'x64',
        });
      });

      it('Use `mac64` before m1', async () => {
        opts.drivers.chrome = {
          baseURL: 'https://localhost',
          version: '91.0.864.53',
        };

        const actual = await computeDownloadUrls(opts);
        assert.strictEqual(actual.chrome, 'https://localhost/91.0.864.53/chromedriver_mac64.zip');
      });

      it('Use `mac64_m1` starting from m1', async () => {
        opts.drivers.chrome = {
          baseURL: 'https://localhost',
          version: '91.0.864.53',
        };

        Object.defineProperty(process, 'arch', {
          value: 'arm64',
        });

        const actual = await computeDownloadUrls(opts);
        assert.strictEqual(actual.chrome, 'https://localhost/91.0.864.53/chromedriver_mac64_m1.zip');
      });

      it('Use `mac_arm64` starting from Chrome 106', async () => {
        opts.drivers.chrome = {
          baseURL: 'https://localhost',
          version: '106.0.5249.61',
        };

        Object.defineProperty(process, 'arch', {
          value: 'arm64',
        });

        const actual = await computeDownloadUrls(opts);
        assert.strictEqual(actual.chrome, 'https://localhost/106.0.5249.61/chromedriver_mac_arm64.zip');
      });
    });

    describe('win', () => {
      before(() => {
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        });
      });

      it('basic version', async () => {
        opts.drivers.chrome = {
          baseURL: 'https://localhost',
          version: '2.0',
        };

        const actual = await computeDownloadUrls(opts);
        assert.strictEqual(actual.chrome, 'https://localhost/2.0/chromedriver_win32.zip');
      });
    });
  });

  describe('firefox', () => {
    beforeEach(() => {
      opts = {
        seleniumVersion: '1.0',
        seleniumBaseURL: 'https://localhost',
        drivers: {
          firefox: {},
        },
      };
    });

    describe('linux', () => {
      before(() => {
        Object.defineProperty(process, 'platform', {
          value: 'linux',
        });
      });

      it('uses leading `v` in version string when >= 0.9.0', async () => {
        opts.drivers.firefox = {
          baseURL: 'https://localhost',
          version: '0.9.0',
        };

        const actual = await computeDownloadUrls(opts);
        assert.strictEqual(actual.firefox, 'https://localhost/v0.9.0/geckodriver-v0.9.0-linux64.tar.gz');
      });

      it('uses `.tar.gz` file extension for versions >= 0.9.0', async () => {
        opts.drivers.firefox = {
          baseURL: 'https://localhost',
          version: '0.9.0',
        };

        const actual = await computeDownloadUrls(opts);
        assert(actual.firefox.indexOf('.tar.gz') > 0);
      });

      it('gets the right arch when arch is x86', async () => {
        opts.drivers.firefox = {
          baseURL: 'https://localhost',
          version: '0.11.0',
          arch: 'x86',
        };

        const actual = await computeDownloadUrls(opts);
        assert(actual.firefox.indexOf('-linux32.tar.gz') > 0);
      });

      it('gets the right arch when arch is x64', async () => {
        opts.drivers.firefox = {
          baseURL: 'https://localhost',
          version: '0.11.0',
          arch: 'x64',
        };

        const actual = await computeDownloadUrls(opts);
        assert(actual.firefox.indexOf('-linux64.tar.gz') > 0);
      });

      it('gets the right arch when arch is x32', async () => {
        opts.drivers.firefox = {
          baseURL: 'https://localhost',
          version: '0.11.0',
          arch: 'x32',
        };

        const actual = await computeDownloadUrls(opts);
        assert(actual.firefox.indexOf('-linux32.tar.gz') > 0);
      });
    });

    describe('mac', () => {
      before(() => {
        Object.defineProperty(process, 'platform', {
          value: 'darwin',
        });
        Object.defineProperty(process, 'arch', {
          value: 'x64',
        });
      });

      it('uses `macos` before m1', async () => {
        opts.drivers.firefox = {
          baseURL: 'https://localhost',
          version: '0.10.0',
        };

        const actual = await computeDownloadUrls(opts);
        assert(actual.firefox.indexOf('macos.') > 0);
      });

      it('uses `macos-aarch64` starting from m1', async () => {
        Object.defineProperty(process, 'arch', {
          value: 'arm64',
        });

        opts.drivers.firefox = {
          baseURL: 'https://localhost',
          version: '0.10.0',
        };

        const actual = await computeDownloadUrls(opts);
        assert(actual.firefox.indexOf('macos-aarch64.') > 0);
      });
    });

    describe('win', () => {
      before(() => {
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        });
      });

      it('gets the right arch when arch is x32 and version >= 0.11.0', async () => {
        opts.drivers.firefox = {
          baseURL: 'https://localhost',
          version: '0.11.1',
          arch: 'x32',
        };

        const actual = await computeDownloadUrls(opts);
        assert(actual.firefox.indexOf('win32.zip') >= 0);
      });

      it('gets the right arch when arch is x64 and version >= 0.11.0', async () => {
        opts.drivers.firefox = {
          baseURL: 'https://localhost',
          version: '0.11.0',
          arch: 'x64',
        };

        const actual = await computeDownloadUrls(opts);
        assert(actual.firefox.indexOf('win64.zip') >= 0);
      });

      it('gets the 64 bits version when no arch specified version >= 0.11.0', async () => {
        opts.drivers.firefox = {
          baseURL: 'https://localhost',
          version: '0.11.0',
        };

        const actual = await computeDownloadUrls(opts);
        assert(actual.firefox.indexOf('win64.zip') >= 0);
      });
    });
  });

  describe('ie', () => {
    before(() => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });
    });

    beforeEach(() => {
      opts = {
        seleniumVersion: '1.0',
        seleniumBaseURL: 'https://localhost',
        drivers: {
          ie: {},
        },
      };
    });

    it('uses `Win32` platform when arch == ia32', async () => {
      opts.drivers.ie = {
        baseURL: 'https://localhost',
        version: '2.20.0',
        arch: 'ia32',
      };

      const actual = await computeDownloadUrls(opts);
      assert(actual.ie.indexOf('IEDriverServer_Win32') > 0);
    });

    it('uses `x64` platform when arch == x64', async () => {
      opts.drivers.ie = {
        baseURL: 'https://localhost',
        version: '2.20.0',
        arch: 'x64',
      };

      const actual = await computeDownloadUrls(opts);
      assert(actual.ie.indexOf('IEDriverServer_x64') > 0);
    });

    it('uses `major.minor` folder for `major.minor.patch` version', async () => {
      opts.drivers.ie = {
        baseURL: 'https://localhost',
        version: '2.20.1',
        arch: 'x64',
      };

      const actual = await computeDownloadUrls(opts);
      assert(actual.ie.indexOf('/2.20/') > 0);
      assert(actual.ie.indexOf('2.20.1.zip') > 0);
    });
  });

  describe('edge', () => {
    before(() => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      });
    });

    beforeEach(() => {
      opts = {
        seleniumVersion: '1.0',
        seleniumBaseURL: 'https://localhost',
        drivers: {
          edge: {},
        },
      };
    });

    const releases = require('../lib/microsoft-edge-releases');

    Object.keys(releases).forEach((version) => {
      it('uses version `' + version + '` correct url', async () => {
        opts.drivers.edge = { version: version };

        const actual = await computeDownloadUrls(opts);
        assert.strictEqual(actual.edge, releases[version].url);
      });
    });

    Object.keys(releases).forEach((version) => {
      it('uses version `' + version + '` correct extension', async () => {
        opts.drivers.edge = { version: version };

        const actual = await computeDownloadUrls(opts);
        assert(actual.edge.indexOf(releases[version].extension) > 0);
      });
    });

    it('throws for unknown releases', (done) => {
      opts.drivers.edge = { version: '10' };

      computeDownloadUrls(opts).catch(() => done());
    });
  });

  describe('chromiumedge', () => {
    beforeEach(() => {
      opts = {
        seleniumVersion: '1.0',
        seleniumBaseURL: 'https://localhost',
        drivers: {
          chromiumedge: {},
        },
      };
    });

    describe('linux', () => {
      before(() => {
        Object.defineProperty(process, 'platform', {
          value: 'linux',
        });
      });

      it('x64', async () => {
        opts.drivers.chromiumedge = {
          baseURL: 'https://localhost',
          version: '86.0.600.0',
          arch: 'x64',
        };

        const actual = await computeDownloadUrls(opts);
        assert.strictEqual(actual.chromiumedge, 'https://localhost/86.0.600.0/edgedriver_linux64.zip');
      });
    });

    describe('mac', () => {
      before(() => {
        Object.defineProperty(process, 'platform', {
          value: 'darwin',
        });
      });

      it('x64', async () => {
        opts.drivers.chromiumedge = {
          baseURL: 'https://localhost',
          version: '86.0.600.0',
          arch: 'x64',
        };

        const actual = await computeDownloadUrls(opts);
        assert.strictEqual(actual.chromiumedge, 'https://localhost/86.0.600.0/edgedriver_mac64.zip');
      });

      it('Use `mac64` on arm64 before Edge 105', async () => {
        opts.drivers.chromiumedge = {
          baseURL: 'https://localhost',
          version: '104.0.1293.70',
          arch: 'arm64',
        };

        const actual = await computeDownloadUrls(opts);
        assert.strictEqual(actual.chromiumedge, 'https://localhost/104.0.1293.70/edgedriver_mac64.zip');
      });

      it('Use `mac64_m1` on arm64 starting from Edge 105', async () => {
        opts.drivers.chromiumedge = {
          baseURL: 'https://localhost',
          version: '105.0.1343.34',
          arch: 'arm64',
        };

        const actual = await computeDownloadUrls(opts);
        assert.strictEqual(actual.chromiumedge, 'https://localhost/105.0.1343.34/edgedriver_mac64_m1.zip');
      });
    });

    describe('win', () => {
      before(() => {
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        });
      });

      it('x32', async () => {
        opts.drivers.chromiumedge = {
          baseURL: 'https://localhost',
          version: '86.0.600.0',
          arch: 'x32',
        };

        const actual = await computeDownloadUrls(opts);
        assert.strictEqual(actual.chromiumedge, 'https://localhost/86.0.600.0/edgedriver_win32.zip');
      });

      it('x64', async () => {
        opts.drivers.chromiumedge = {
          baseURL: 'https://localhost',
          version: '86.0.600.0',
        };

        const actual = await computeDownloadUrls(opts);
        assert.strictEqual(actual.chromiumedge, 'https://localhost/86.0.600.0/edgedriver_win64.zip');
      });
    });
  });
});

const assert = require('assert');
const start = require('../lib/start');
const defaultConfig = require('../lib/default-config')();
const install = require('../lib/install');
const isPortReachable = require('is-port-reachable');
const processKiller = require('../lib/processKiller');
const checkPathsExistence = require('../lib/check-paths-existence');
const computeFsPaths = require('../lib/compute-fs-paths');
const path = require('path');

const opts = {
  seleniumVersion: defaultConfig.version,
  seleniumBaseURL: defaultConfig.baseURL,
  drivers: defaultConfig.drivers,
};

describe('check onlyDriver downloading only driver without selenium server and others drivers', () => {
  it('check onlyDriver', async () => {
    await processKiller([9515, 4444]);
    const testOpt = { ...{ onlyDriver: 'chrome' }, ...opts };
    const paths = await install(testOpt);

    testOpt.drivers = {};
    testOpt.drivers.chrome = opts.drivers.chrome;

    const fsPaths = await computeFsPaths({
      seleniumVersion: opts.seleniumVersion,
      drivers: testOpt.drivers,
      basePath: path.join(__dirname, '..', '.selenium'),
    });

    try {
      await checkPathsExistence(Object.keys(fsPaths).map((name) => fsPaths[name].installPath));

      assert(false);
    } catch {
      await checkPathsExistence(Object.keys(paths.fsPaths).map((name) => fsPaths[name].installPath));
    }
  });

  it('check without onlyDriver', async () => {
    await processKiller([9515, 4444]);
    const testOpt = opts;
    const paths = await install(testOpt);

    await checkPathsExistence(Object.keys(paths.fsPaths).map((name) => paths.fsPaths[name].installPath));
  });
});

describe('check onlyDriver with certain name of driver', () => {
  it('check "install" method with onlyDriver chromiumedge should return path with only certain driver', async () => {
    await processKiller([9515, 4444]);
    const testOpt = { ...{ onlyDriver: 'chromiumedge' }, ...opts };
    const paths = await install(testOpt);

    assert(Object.keys(paths.fsPaths).length === 1 && Object.keys(paths.fsPaths).every((i) => i === 'chromiumedge'));
  });

  it('check "install" method with onlyDriver chrome should return path with only certain driver', async () => {
    await processKiller([9515, 4444]);
    const testOpt = { ...{ onlyDriver: 'chrome' }, ...opts };
    const paths = await install(testOpt);

    assert(Object.keys(paths.fsPaths).length === 1 && Object.keys(paths.fsPaths).every((i) => i === 'chrome'));
  });

  it('check "install" method with onlyDriver firefox should return path with only certain driver', async () => {
    await processKiller([9515, 4444]);
    const testOpt = { ...{ onlyDriver: 'firefox' }, ...opts };
    const paths = await install(testOpt);

    assert(Object.keys(paths.fsPaths).length === 1 && Object.keys(paths.fsPaths).every((i) => i === 'firefox'));
  });

  it('check "install" method with onlyDriver firefox should return path with only certain driver', async () => {
    await processKiller([9515, 4444]);
    const testOpt = { ...{ onlyDriver: 'unknown' }, ...opts };

    try {
      await install(testOpt);

      assert(false);
    } catch (_) {
      // eslint-disable-next-line no-empty
    }
  });
});

describe('check staring drivers twice with onlyDriver option', () => {
  it('check staring twice chromedriver', async () => {
    await processKiller([9515, 4444]);
    const testOpt = { ...{ onlyDriver: 'chrome' }, ...opts };
    const process1 = await start(testOpt);

    assert(await isPortReachable(9515));
    assert(process1._handle);

    const process2 = await start(testOpt);

    assert(await isPortReachable(9515));
    assert(!process1._handle);
    assert(process2._handle);
  });

  it('check staring twice chromiumedge', async () => {
    await processKiller([9515, 4444]);
    const testOpt = { ...{ onlyDriver: 'chromiumedge' }, ...opts };
    const process1 = await start(testOpt);

    assert(await isPortReachable(9515));
    assert(process1._handle);

    const process2 = await start(testOpt);

    assert(await isPortReachable(9515));
    assert(!process1._handle);
    assert(process2._handle);
  });

  it('check staring twice firefox', async () => {
    await processKiller([9515, 4444]);
    const testOpt = { ...{ onlyDriver: 'firefox' }, ...opts };
    const process1 = await start(testOpt);

    assert(await isPortReachable(4444, { timeout: 1000, host: '127.0.0.1' }));
    assert(process1._handle);

    const process2 = await start(testOpt);

    assert(await isPortReachable(4444, { timeout: 1000, host: '127.0.0.1' }));
    assert(!process1._handle);
    assert(process2._handle);
  });
});

describe('check staring drivers port existence', () => {
  after(async () => {
    await processKiller([9515, 4444], ['chromiumedge', 'chromedriver', 'firefox']);
  });

  it('check staring drivers port chrome', async () => {
    await processKiller([9515, 4444]);
    const testOpt = { ...{ onlyDriver: 'chrome' }, ...opts };
    await start(testOpt);

    assert(await isPortReachable(9515));
  });

  it('check staring drivers port firefox', async () => {
    await processKiller([9515, 4444]);
    const testOpt = { ...{ onlyDriver: 'firefox' }, ...opts };
    await start(testOpt);

    assert(await isPortReachable(4444, { timeout: 1000, host: '127.0.0.1' }));
  });

  it('check staring drivers port chromiumedge', async () => {
    await processKiller([9515, 4444]);
    const testOpt = { ...{ onlyDriver: 'chromiumedge' }, ...opts };
    await start(testOpt);

    assert(await isPortReachable(9515));
  });
});

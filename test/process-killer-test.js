const assert = require('assert');
const merge = require('lodash.merge');
const start = require('../lib/start');
const defaultConfig = require('../lib/default-config')();
const processKiller = require('../lib/processKiller');

/** @type {import('../lib/start').StartOptions} */
let opts = {
  version: defaultConfig.version,
  drivers: defaultConfig.drivers,
};

describe('check usual a start by default', () => {
  before(async () => {
    await processKiller([4444]);
  });

  after(async () => {
    await processKiller([4444]);
  });

  it('check usual a start', async () => {
    try {
      await start(opts);
    } catch (err) {
      assert(false);
    }
  });
});

describe('check killing before starting by default', () => {
  before(async () => {
    await processKiller([4444]);
  });

  after(async () => {
    await processKiller([4444]);
  });

  it('start selenium server twice with processKiller', async () => {
    opts = merge(opts, {
      processKiller: true,
    });

    try {
      await start(opts);
      await start(opts);
    } catch (err) {
      assert(false);
    }
  });
});

describe('check killing before when started twice', () => {
  before(async () => {
    await processKiller([4444]);
  });

  after(async () => {
    await processKiller([4444]);
  });

  it('start selenium server twice', async () => {
    try {
      await start(opts);
      await start(opts);
    } catch (err) {
      assert(false);
    }
  });
});

describe('check killing before starting with falsy processKiller property', () => {
  before(async () => {
    await processKiller([4444]);
  });

  after(async () => {
    await processKiller([4444]);
  });

  it('start selenium server twice with falsy processKiller property', async () => {
    let testErr;

    opts = merge(opts, {
      processKiller: false,
    });

    try {
      await start(opts);
      await start(opts);
    } catch (err) {
      testErr = err;
    }
    assert(testErr && testErr.message.includes('Port 4444 is already in use'));
  });
});

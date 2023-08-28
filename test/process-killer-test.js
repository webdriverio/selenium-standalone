const assert = require('assert');
const merge = require('lodash.merge');
const start = require('../lib/start');
const defaultConfig = require('../lib/default-config')();
const { processKiller } = require('../lib/processKiller');

let opts = {
  seleniumVersion: defaultConfig.version,
  seleniumBaseURL: defaultConfig.baseURL,
  drivers: defaultConfig.drivers,
};

describe('check usual a start is going to be without killing processes', () => {
  before(async () => {
    await processKiller({}, ':4444');
  });

  after(async () => {
    await processKiller({}, ':4444');
  });

  it('check usual a start', async () => {
    try {
      await start(opts);
    } catch (err) {
      assert(false);
    }
  });
});

describe('check killing before starting with truthy processKiller property', () => {
  before(async () => {
    await processKiller({}, ':4444');
  });

  after(async () => {
    await processKiller({}, ':4444');
  });

  it('start selenium server twice with processKiller', async () => {
    try {
      await start(opts);
      await start(opts);
    } catch (err) {
      assert(!err.message.includes('Port 4444 is already in use'));
    }
  });
});

describe('check killing before starting with falsy processKiller property', () => {
  before(async () => {
    await processKiller({}, ':4444');
  });

  after(async () => {
    await processKiller({}, ':4444');
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
    assert(!testErr || ('message' in testErr && testErr.message.includes('Port 4444 is already in use')));
  });
});

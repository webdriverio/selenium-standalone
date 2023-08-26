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

describe('check killing before starting with processKiller property like 4444', () => {
  before(async function () {
    await processKiller({}, ':4444');
  });

  after(async function () {
    await processKiller({}, ':4444');
  });

  it('start selenium server twice processKiller is 4444', async () => {
    opts = merge(opts, {
      processKiller: '4444',
    });

    try {
      await start(opts);
      await start(opts);
    } catch (err) {
      assert(!err.message.includes('Port 4444 is already in use'));
    }
  });
});

describe('check killing before starting with processKiller property like :4444', () => {
  before(async function () {
    await processKiller({}, ':4444');
  });

  after(async function () {
    await processKiller({}, ':4444');
  });

  it('start selenium server twice processKiller is :4444', async () => {
    opts = merge(opts, {
      processKiller: ':4444',
    });

    try {
      await start(opts);
      await start(opts);
    } catch (err) {
      assert(!err.message.includes('Port 4444 is already in use'));
    }
  });
});

describe('config with wrong processKiller property', () => {
  before(async function () {
    await processKiller({}, ':4444');
  });

  after(async function () {
    await processKiller({}, ':4444');
  });

  it('start selenium server twice processKiller is "wrong"', async () => {
    let testErr;

    opts = merge(opts, {
      processKiller: 'wrong',
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

describe('config without processKiller property"', () => {
  before(async function () {
    await processKiller({}, ':4444');
  });

  after(async function () {
    await processKiller({}, ':4444');
  });

  it('start selenium server twice processKiller is undefined', async () => {
    let testErr;

    opts = delete opts.processKiller;

    try {
      await start(opts);
      await start(opts);
    } catch (err) {
      testErr = err;
    }
    assert(!testErr || ('message' in testErr && testErr.message.includes('Port 4444 is already in use')));
  });
});

describe('config with processKiller property like 5555 when is running 4444"', () => {
  before(async function () {
    await processKiller({}, ':4444');
  });

  after(async function () {
    await processKiller({}, ':4444');
  });

  it('start selenium server twice port 5555', async () => {
    let testErr;

    opts = merge(opts, {
      processKiller: '5555',
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

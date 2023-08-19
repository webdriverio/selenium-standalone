const { assert } = require('chai');
const fs = require('fs');
const path = require('path');

describe('when files are missing', () => {
  const from = path.join(__dirname, '..', '.selenium');
  const to = path.join(__dirname, '..', '.selenium-tmp');

  it('should fail', async () => {
    const selenium = require('../');

    try {
      await selenium.start();

      throw new Error();
    } catch {
      assert(true);
    }
  });

  before(() => {
    fs.renameSync(from, to);
  });
  after(() => {
    fs.renameSync(to, from);
  });
});

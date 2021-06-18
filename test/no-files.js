const fs = require('fs');
const path = require('path');

describe('when files are missing', () => {
  const from = path.join(__dirname, '..', '.selenium');
  const to = path.join(__dirname, '..', '.selenium-tmp');

  it('should fail', (done) => {
    const selenium = require('../');
    selenium.start().catch(() => done());
  });

  before(() => {
    fs.renameSync(from, to);
  });
  after(() => {
    fs.renameSync(to, from);
  });
});

describe('when files are missing', () => {
  it('should fail', (done) => {
    const fs = require('fs');
    const path = require('path');
    const from = path.join(__dirname, '..', '.selenium');
    const to = path.join(__dirname, '..', '.selenium-tmp');

    fs.renameSync(from, to);

    const selenium = require('../');
    selenium.start((err) => {
      fs.renameSync(to, from);
      if (err) {
        done();
        return;
      }

      done(new Error('We should have got an error'));
    });
  });
});

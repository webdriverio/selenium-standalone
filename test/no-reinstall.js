describe('when files are installed', () => {
  it('should not reinstall them', function (done) {
    this.timeout(120000);

    const fs = require('fs');
    const path = require('path');
    const targetDir = path.join(__dirname, '..', '.selenium');
    const selenium = require('..');
    const origDirModifTime = fs.statSync(targetDir).mtime.getTime();

    // Compare last modified time of files after running the installation
    // again. It shouldn't download any files, otherwise it fails.
    selenium.install(() => {
      const currentDirModifTime = fs.statSync(targetDir).mtime.getTime();
      const isModified = currentDirModifTime > origDirModifTime;

      if (isModified) {
        done(new Error('It should not have reinstalled files'));
      } else {
        done();
      }
    });
  });
});

const assert = require('assert');

describe('when files are installed', () => {
  it('should not reinstall them', async function () {
    this.timeout(120000);

    const fs = require('fs');
    const path = require('path');
    const targetDir = path.join(__dirname, '..', '.selenium');
    const selenium = require('..');
    const origDirModifTime = fs.statSync(targetDir).mtime.getTime();

    // Compare last modified time of files after running the installation
    // again. It shouldn't download any files, otherwise it fails.
    await selenium.install();
    const currentDirModifTime = fs.statSync(targetDir).mtime.getTime();
    const isModified = currentDirModifTime > origDirModifTime;

    assert.strictEqual(isModified, false, 'It should not have reinstalled files');
  });
});

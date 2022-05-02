const assert = require('assert');

describe('when files are installed', () => {
  it('should not reinstall them', async function () {
    this.timeout(120000);

    const fs = require('fs');
    const path = require('path');
    const targetDir = path.join(__dirname, '..', '.selenium');
    const selenium = require('..');

    // Recursively find files in the given directory
    function walk(dirname, files = []) {
      fs.readdirSync(dirname).forEach((name) => {
        const filepath = path.join(dirname, name);
        if (fs.statSync(filepath).isDirectory()) {
          walk(filepath, files);
        } else {
          files.push(filepath);
        }
      });
      return files;
    }
    const installedFiles = walk(targetDir);

    // Get last modified time of files that should already be installed in
    // the .selenium directory.
    const mtimes = installedFiles.reduce((acc, filepath) => {
      acc[filepath] = fs.statSync(filepath).mtime.getTime();
      return acc;
    }, {});

    // Compare last modified time of files after running the installation
    // again. It shouldn't download any files, otherwise it fails.
    await selenium.install();

    const isModified = !installedFiles.every((filepath) => {
      return mtimes[filepath] === fs.statSync(filepath).mtime.getTime();
    });

    assert.strictEqual(isModified, false, 'It should not have reinstalled files');
  });
});

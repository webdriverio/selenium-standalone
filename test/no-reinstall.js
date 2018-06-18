describe('when files are installed', function () {
    it('should not reinstall them', function (done) {

        var fs = require('fs');
        var path = require('path');
        var targetDir = path.join(__dirname, '..', '.selenium');
        var selenium = require('..');

        var origDirModifTime = fs.statSync(targetDir).mtime.getTime();

        // Compare last modified time of files after running the installation
        // again. It shouldn't download any files, otherwise it fails.
        selenium.install(function () {
            var currentDirModifTime = fs.statSync(targetDir).mtime.getTime();
            var isModified = currentDirModifTime > origDirModifTime;

            if (isModified) {
                done(new Error('It should not have reinstalled files'));
            } else {
                done();
            }
        });
    });
});

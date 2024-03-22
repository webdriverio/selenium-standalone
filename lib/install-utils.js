const tarStream = require('tar-stream');
const os = require('os');
const { default: mkdirp } = require('mkdirp');
const path = require('path');
const yauzl = require('yauzl');
const fs = require('fs');
const zlib = require('zlib');
const { default: got } = require('got');
const debug = require('debug')('selenium-standalone:install');
const { logError } = require('./log-error');
const md5 = require('md5');

const installers = ['selenium', 'chrome', 'ie', 'firefox', 'edge', 'chromiumedge'];

/**
 * @param {import('yauzl').Entry} entry
 * @returns {boolean}
 */
const isExecutable = (entry) => {
  // Windows .exe files are executables
  if (path.extname(entry.fileName) === '.exe') {
    return true;
  }

  // Extract the Unix file permissions.
  // See https://github.com/thejoshwolfe/yauzl/issues/102 and https://unix.stackexchange.com/a/14727.
  const permissions = entry.externalFileAttributes >>> 16;

  // Directories are not executable
  if (permissions & fs.constants.S_IFDIR) {
    return false;
  }

  // Return true when the user, group, or other executable bits are set.
  return (
    !!(permissions & fs.constants.S_IXUSR) ||
    !!(permissions & fs.constants.S_IXGRP) ||
    !!(permissions & fs.constants.S_IXOTH)
  );
};

const basePath = (fullPath) => {
  return path.dirname(fullPath);
};

const logInstallSummary = (logger, paths, urls) => {
  installers.forEach((name) => {
    if (!paths[name]) {
      return;
    }

    logger('---');
    logger(name + ' install:');
    logger('from: ' + urls[name]);
    logger('to: ' + paths[name].installPath);
  });
};

function asyncLogEnd(logger) {
  logger('');
  logger('-----');
  logger('selenium-standalone installation finished');
  logger('-----');
}

async function createDirs(paths) {
  const installDirectories = Object.keys(paths).map((name) => {
    return paths[name].installPath;
  });

  for (const d of installDirectories.map(basePath)) {
    await mkdirp(d);
  }
}

const chmod = (where) =>
  new Promise((resolve, reject) => {
    debug('chmod 0755 on', where);
    fs.chmod(where, '0755', (err) => {
      if (err) {
        return reject(logError('chmod', err));
      }
      resolve();
    });
  });

async function setDriverFilePermissions(where) {
  debug('setDriverFilePermissions', where);

  const requireChmod = await new Promise((resolve) =>
    fs.access(where, fs.constants.R_OK | fs.constants.X_OK, (err) => {
      if (err) {
        debug('error in fs.access', where, err);
      }
      resolve(!!err);
    })
  );

  if (requireChmod) {
    await chmod(where);
  }
}

async function isUpToDate(url, file, pathToFile) {
  if (!file) {
    return false;
  }
  try {
    const response = await got.head(url, {
      timeout: 2500,
    });
    if (response.headers['content-length'] === `${fs.statSync(pathToFile).size}`) {
      return true;
    }
    return response.headers.etag.includes(md5(file).toString());
  } catch (err) {
    logError(`Remote file size/hash in ${url} don't match with local file ${pathToFile}`);
    return false;
  }
}

function getTempFileName(suffix) {
  return os.tmpdir() + path.sep + os.uptime() + suffix;
}

async function uncompressDownloadedFile(zipFilePath) {
  debug('unzip ' + zipFilePath);

  return new Promise((resolve, reject) =>
    yauzl.open(zipFilePath, function onOpenZipFile(err, zipFile) {
      if (err) {
        return reject(logError('uncompressDownloadedFile:yauzl.open', err));
      }
      zipFile.on('entry', (entry) => {
        if (fs.existsSync(entry.fileName) && fs.lstatSync(entry.fileName).isDirectory()) {
          return; // ignore folders, i.e. release notes folder in edge driver zip
        }
        if (!isExecutable(entry)) {
          return;
        }

        zipFile.openReadStream(entry, { autoClose: true }, function onOpenZipFileEntryReadStream(errRead, readStream) {
          if (errRead) {
            return reject(logError('uncompressDownloadedFile:zipFile.openReadStream', err));
          }

          // The .zip file usually contain an executable with the same name as the driver.
          // For example, we expect to extract "msedgedriver.exe" as "msedgedriver.exe".
          //
          // There are three known exceptions:
          //
          //  1.  The .zip files from Chrome for Testing have files in a directory.
          //      For example, we want to extract "chromedriver-mac-arm64/chromedriver" as "chromedriver" from "chromedriver-mac-arm64.zip".
          //
          //  2.  msedgedriver v86 and v87 for mac64 include a second executable file, libc++.dylib, It is also extracted.
          //
          //  3.  The exectuables for geckodriver <= v0.7.1 are called "wires.exe" or "wires-<version>-win.exe".
          //      These releases are so old we can ignore them.
          //
          const extractPath = path.join(path.dirname(zipFilePath), path.basename(entry.fileName));

          const extractWriteStream = fs
            .createWriteStream(extractPath)
            .once('error', (errWs) => reject(logError('uncompressDownloadedFile:readStream.pipe', errWs)));
          readStream
            .pipe(extractWriteStream)
            .once('error', (errPipe) => reject(logError('uncompressDownloadedFile:readStream.pipe', errPipe)));
        });
      });
      zipFile.on('close', resolve);
    })
  );
}

async function uncompressGzippedFile(from, gzipFilePath) {
  return new Promise((resolve, reject) => {
    const gunzip = zlib.createGunzip();
    const extractPath = path.join(path.dirname(gzipFilePath), path.basename(gzipFilePath, '.gz'));
    const writeStream = fs
      .createWriteStream(extractPath)
      .once('error', (err) => reject(logError('uncompressGzippedFile:createWriteStream', err)));
    const gunzippedContent = fs.createReadStream(gzipFilePath).pipe(gunzip).once('error', reject);

    if (from.substr(-7) === '.tar.gz') {
      const extractor = tarStream.extract();
      let fileAlreadyUnarchived = false;
      let cbCalled = false;

      extractor
        .on('entry', (header, stream, callback) => {
          if (fileAlreadyUnarchived) {
            if (!cbCalled) {
              cbCalled = true;
              return reject(new Error('Tar archive contains more than one file'));
            }
            fileAlreadyUnarchived = true;
          }
          stream.pipe(writeStream);
          stream.on('end', () => {
            callback();
          });
          stream.resume();
        })
        .on('finish', () => {
          if (!cbCalled) {
            cbCalled = true;
            resolve();
          }
        });
      gunzippedContent.pipe(extractor);
    } else {
      gunzippedContent.pipe(writeStream).on('finish', resolve);
    }
  });
}

async function runInstaller(installerFile, from, to) {
  const logFile = getTempFileName('installer.log');
  const options = [
    '/passive', // no user interaction, only show progress bar
    '/l*',
    logFile, // save install log to this file
    '/i',
    installerFile, // msi file to install
  ];

  const spawn = require('cross-spawn');
  const runner = spawn('msiexec', options, { stdio: 'inherit' });

  return new Promise((resolve, reject) => {
    runner.on('exit', () => {
      fs.readFile(logFile, 'utf16le', (err, data) => {
        if (err) {
          return reject(logError('runInstaller:readFile', err));
        }

        const installDir = data
          .split(os.EOL)
          .map((line) => {
            const match = line.match(/INSTALLDIR = (.+)$/);
            return match && match[1];
          })
          .filter((line) => line != null)[0];

        if (!installDir) {
          return reject(new Error('Could not find installed driver'));
        }

        fs.createReadStream(installDir + 'MicrosoftWebDriver.exe', {
          autoClose: true,
        })
          .pipe(fs.createWriteStream(to, { autoClose: true }))
          .once('finish', resolve)
          .once('error', (errWs) => reject(logError('runInstaller:createWriteStream', errWs)));
      });
    });

    runner.on('error', (errRunner) => reject(logError('runInstaller:runner', errRunner)));
  });
}

module.exports = {
  asyncLogEnd,
  createDirs,
  setDriverFilePermissions,
  logInstallSummary,
  isUpToDate,
  getTempFileName,
  uncompressDownloadedFile,
  uncompressGzippedFile,
  runInstaller,
};

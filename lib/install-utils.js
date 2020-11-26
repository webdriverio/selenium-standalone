const tarStream = require('tar-stream');
const os = require('os');
const crypto = require('crypto');
const mkdirp = require('mkdirp');
const path = require('path');
const async = require('async');
const fs = require('fs');
const request = require('request');
const merge = require('lodash').merge;
const debug = require('debug')('selenium-standalone:install');

const installers = ['selenium', 'chrome', 'ie', 'firefox', 'edge', 'chromiumedge'];

const isBrowserDriver = (fileName) => {
  const extensions = ['.exe'];
  return extensions.some((ext) => fileName.endsWith(ext)) || !fileName.includes('.');
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

function asyncLogEnd(logger, cb) {
  setImmediate(() => {
    logger('');
    logger('');
    logger('-----');
    logger('selenium-standalone installation finished');
    logger('-----');
    cb();
  });
}

function createDirs(paths, cb) {
  const installDirectories = Object.keys(paths).map((name) => {
    return paths[name].installPath;
  });

  async.eachSeries(installDirectories.map(basePath), mkdirp, cb);
}

function setDriverFilePermissions(where, cb) {
  debug('setDriverFilePermissions', where);

  const chmod = () => {
    debug('chmod 0755 on', where);
    fs.chmod(where, '0755', cb);
  };

  // node.js 0.10.x does not support fs.access
  fs.stat(where, (err, stat) => {
    debug('%s stats : %O', where, stat);
  });
  fs.access(where, fs.R_OK | fs.X_OK, (err) => {
    if (err) {
      debug('error in fs.access', where, err);
      chmod();
    } else {
      return cb();
    }
  });
}

function checksum(filepath, cb) {
  if (!fs.existsSync(filepath)) {
    return cb(null, null);
  }

  const hash = crypto.createHash('md5');
  const stream = fs.createReadStream(filepath);

  stream
    .on('data', (data) => {
      hash.update(data, 'utf8');
    })
    .on('end', () => {
      cb(null, hash.digest('hex'));
    })
    .once('error', cb);
}

function isUpToDate(url, requestOpts, hash, cb) {
  if (!hash) {
    return cb(null, false);
  }

  const query = merge({}, requestOpts, {
    url: url,
    headers: {
      'If-None-Match': '"' + hash + '"',
    },
  });

  const req = request.get(query);
  req
    .on('response', (res) => {
      req.abort();

      if (res.statusCode === 304) {
        return cb(null, true);
      }

      if (res.statusCode !== 200) {
        return cb(new Error('Could not request headers from ' + url + ': ', res.statusCode));
      }

      cb(null, false);
    })
    .once('error', (err) => {
      cb(new Error('Could not request headers from ' + url + ': ' + err));
    });
}

function getTempFileName(suffix) {
  return os.tmpdir() + path.sep + os.uptime() + suffix;
}

function uncompressDownloadedFile(zipFilePath, cb) {
  debug('unzip ' + zipFilePath);

  const yauzl = require('yauzl');

  yauzl.open(zipFilePath, function onOpenZipFile(err, zipFile) {
    if (err) {
      cb(err);
      return;
    }
    zipFile.on('entry', (entry) => {
      if (/.*\/.*/.test(entry.fileName)) {
        return; // ignore folders, i.e. release notes folder in edge driver zip
      }
      zipFile.openReadStream(entry, { autoClose: true }, function onOpenZipFileEntryReadStream(errRead, readStream) {
        if (errRead) {
          cb(errRead);
          return;
        }
        const extractPath = path.join(
          path.dirname(zipFilePath),
          isBrowserDriver(entry.fileName) ? path.basename(zipFilePath, '.zip') : entry.fileName
        );
        const extractWriteStream = fs
          .createWriteStream(extractPath)
          .once('error', cb.bind(null, new Error('Could not write to ' + extractPath)));
        readStream.pipe(extractWriteStream).once('error', cb.bind(null, new Error('Could not read ' + zipFilePath)));
      });
    });
    zipFile.on('close', () => {
      cb();
    });
  });
}

function uncompressGzippedFile(from, gzipFilePath, cb) {
  const gunzip = require('zlib').createGunzip();
  const extractPath = path.join(path.dirname(gzipFilePath), path.basename(gzipFilePath, '.gz'));
  const writeStream = fs.createWriteStream(extractPath).once('error', () => {
    cb.bind(null, new Error('Could not write to ' + extractPath));
  });
  const gunzippedContent = fs
    .createReadStream(gzipFilePath)
    .pipe(gunzip)
    .once('error', cb.bind(null, new Error('Could not read ' + gzipFilePath)));

  if (from.substr(-7) === '.tar.gz') {
    const extractor = tarStream.extract();
    let fileAlreadyUnarchived = false;
    let cbCalled = false;

    extractor
      .on('entry', (header, stream, callback) => {
        if (fileAlreadyUnarchived) {
          if (!cbCalled) {
            cb(new Error('Tar archive contains more than one file'));
            cbCalled = true;
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
          cb();
          cbCalled = true;
        }
      });
    gunzippedContent.pipe(extractor);
  } else {
    gunzippedContent.pipe(writeStream).on('finish', () => {
      cb();
    });
  }
}

function runInstaller(installerFile, from, to, cb) {
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

  runner.on('exit', () => {
    fs.readFile(logFile, 'utf16le', (err, data) => {
      if (err) {
        return cb(err);
      }

      const installDir = data
        .split(os.EOL)
        .map((line) => {
          const match = line.match(/INSTALLDIR = (.+)$/);
          return match && match[1];
        })
        .filter((line) => {
          return line != null;
        })[0];

      if (installDir) {
        fs.createReadStream(installDir + 'MicrosoftWebDriver.exe', {
          autoClose: true,
        })
          .pipe(fs.createWriteStream(to, { autoClose: true }))
          .once('finish', () => {
            cb();
          })
          .once('error', (errWrite) => {
            cb(errWrite);
          });
      } else {
        cb(new Error('Could not find installed driver'));
      }
    });
  });

  runner.on('error', (err) => {
    cb(err);
  });
}

module.exports = {
  isBrowserDriver,
  asyncLogEnd,
  createDirs,
  setDriverFilePermissions,
  logInstallSummary,
  checksum,
  isUpToDate,
  getTempFileName,
  uncompressDownloadedFile,
  uncompressGzippedFile,
  runInstaller,
};

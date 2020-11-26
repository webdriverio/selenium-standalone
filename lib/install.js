/* eslint-disable no-shadow */
module.exports = install;

const async = require('async');
const fs = require('fs');
const merge = require('lodash').merge;
const assign = require('lodash').assign;
const mapValues = require('lodash').mapValues;
const values = require('lodash').values;
const path = require('path');
const request = require('request');

const computeDownloadUrls = require('./compute-download-urls');
const computeFsPaths = require('./compute-fs-paths');
const defaultConfig = require('./default-config');
const noop = require('./noop');
const {
  uncompressDownloadedFile,
  asyncLogEnd,
  createDirs,
  setDriverFilePermissions,
  logInstallSummary,
  checksum,
  isUpToDate,
  getTempFileName,
  uncompressGzippedFile,
  runInstaller,
} = require('./install-utils');
const { checkArgs } = require('./check-args');

function install(_opts, _cb) {
  const { opts, cb } = checkArgs('Install API', _opts, _cb);

  let total = 0;
  let progress = 0;
  let startedRequests = 0;
  let expectedRequests;

  const logger = opts.logger || noop;

  if (!opts.baseURL) {
    opts.baseURL = defaultConfig.baseURL;
  }

  if (!opts.version) {
    opts.version = defaultConfig.version;
  }

  if (opts.drivers) {
    // Merge in missing driver options for those specified
    opts.drivers = mapValues(opts.drivers, (config, name) => {
      return merge({}, defaultConfig.drivers[name], config);
    });
  } else {
    opts.drivers = defaultConfig.drivers;
  }

  if (opts.singleDriverInstall) {
    const singleDriver = opts.drivers[opts.singleDriverInstall];
    if (singleDriver) {
      opts.drivers = {};
      opts.drivers[opts.singleDriverInstall] = singleDriver;
    }
  }

  if (process.platform !== 'win32') {
    delete opts.drivers.ie;
    delete opts.drivers.edge;
  }
  expectedRequests = Object.keys(opts.drivers).length + 1;

  const requestOpts = assign({ followAllRedirects: true }, opts.requestOpts);
  if (opts.proxy) {
    requestOpts.proxy = opts.proxy;
  }

  opts.progressCb = opts.progressCb || noop;

  logger('----------');
  logger('selenium-standalone installation starting');
  logger('----------');
  logger('');

  const fsPaths = computeFsPaths({
    seleniumVersion: opts.version,
    drivers: opts.drivers,
    basePath: opts.basePath,
  });

  const urls = computeDownloadUrls({
    seleniumVersion: opts.version,
    seleniumBaseURL: opts.baseURL,
    drivers: opts.drivers,
  });

  logInstallSummary(logger, fsPaths, urls);

  const tasks = [
    createDirs.bind(null, fsPaths),
    download.bind(null, {
      urls: urls,
      fsPaths: fsPaths,
    }),
    asyncLogEnd.bind(null, logger),
  ];

  values(fsPaths)
    .filter(({ requireChmod }) => requireChmod)
    .forEach(({ installPath }) => {
      tasks.push(setDriverFilePermissions.bind(null, installPath));
    });

  async.series(tasks, (err) => {
    cb(err, fsPaths);
  });

  function onlyInstallMissingFiles(opts, cb) {
    async.waterfall(
      [checksum.bind(null, opts.to), isUpToDate.bind(null, opts.from, requestOpts)],
      (error, isLatest) => {
        if (error) {
          return cb(error);
        }

        // File already exists. Prevent download/installation.
        if (isLatest) {
          logger('---');
          logger('File from ' + opts.from + ' has already been downloaded');
          expectedRequests -= 1;
          return cb();
        }

        opts.installer.call(
          null,
          {
            to: opts.to,
            from: opts.from,
          },
          cb
        );
      }
    );
  }

  function download(opts, cb) {
    const installers = [
      {
        installer: installSelenium,
        from: opts.urls.selenium,
        to: opts.fsPaths.selenium.downloadPath,
      },
    ];

    if (opts.fsPaths.chrome) {
      installers.push({
        installer: installChromeDr,
        from: opts.urls.chrome,
        to: opts.fsPaths.chrome.downloadPath,
      });
    }

    if (process.platform === 'win32' && opts.fsPaths.ie) {
      installers.push({
        installer: installIeDr,
        from: opts.urls.ie,
        to: opts.fsPaths.ie.downloadPath,
      });
    }

    if (process.platform === 'win32' && opts.fsPaths.edge) {
      installers.push({
        installer: installEdgeDr,
        from: opts.urls.edge,
        to: opts.fsPaths.edge.downloadPath,
      });
    }

    if (opts.fsPaths.firefox) {
      installers.push({
        installer: installFirefoxDr,
        from: opts.urls.firefox,
        to: opts.fsPaths.firefox.downloadPath,
      });
    }

    if (opts.fsPaths.chromiumedge) {
      installers.push({
        installer: installChromiumEdgeDr,
        from: opts.urls.chromiumedge,
        to: opts.fsPaths.chromiumedge.downloadPath,
      });
    }

    const steps = installers.map((opts) => {
      return onlyInstallMissingFiles.bind(null, opts);
    });

    async.parallel(steps, cb);
  }

  function installSelenium(opts, cb) {
    installSingleFile(opts.from, opts.to, cb);
  }

  function installEdgeDr(opts, cb) {
    if (path.extname(opts.from) === '.msi') {
      downloadInstallerFile(opts.from, opts.to, cb);
    } else {
      installSingleFile(opts.from, opts.to, cb);
    }
  }

  function installSingleFile(from, to, cb) {
    getDownloadStream(from, (err, stream) => {
      if (err) {
        return cb(err);
      }

      stream
        .pipe(fs.createWriteStream(to))
        .once('error', cb.bind(null, new Error('Could not write to ' + to)))
        .once('finish', cb);
    });
  }

  function downloadInstallerFile(from, to, cb) {
    if (process.platform !== 'win32') {
      throw new Error('Could not install an `msi` file on the current platform');
    }

    getDownloadStream(from, (err, stream) => {
      if (err) {
        return cb(err);
      }

      const installerFile = getTempFileName('installer.msi');
      const msiWriteStream = fs
        .createWriteStream(installerFile)
        .once('error', cb.bind(null, new Error('Could not write to ' + to)));
      stream.pipe(msiWriteStream);

      msiWriteStream.once('finish', runInstaller.bind(null, installerFile, from, to, cb));
    });
  }

  function installChromeDr(opts, cb) {
    installZippedFile(opts.from, opts.to, cb);
  }

  function installIeDr(opts, cb) {
    installZippedFile(opts.from, opts.to, cb);
  }

  function installFirefoxDr(opts, cb) {
    // only windows build is a zip
    if (path.extname(opts.from) === '.zip') {
      installZippedFile(opts.from, opts.to, cb);
    } else {
      installGzippedFile(opts.from, opts.to, cb);
    }
  }

  function installChromiumEdgeDr(opts, cb) {
    installZippedFile(opts.from, opts.to, cb);
  }

  function installGzippedFile(from, to, cb) {
    getDownloadStream(from, (err, stream) => {
      if (err) {
        return cb(err);
      }
      // Store downloaded compressed file
      const gzipWriteStream = fs
        .createWriteStream(to)
        .once('error', cb.bind(null, new Error('Could not write to ' + to)));
      stream.pipe(gzipWriteStream);

      gzipWriteStream.once('finish', uncompressGzippedFile.bind(null, from, to, cb));
    });
  }

  function installZippedFile(from, to, cb) {
    getDownloadStream(from, (err, stream) => {
      if (err) {
        return cb(err);
      }

      // Store downloaded compressed file
      const zipWriteStream = fs
        .createWriteStream(to)
        .once('error', cb.bind(null, new Error('Could not write to ' + to)));
      stream.pipe(zipWriteStream);

      // Uncompress downloaded file
      zipWriteStream.once('finish', uncompressDownloadedFile.bind(null, to, cb));
    });
  }

  function getDownloadStream(downloadUrl, cb) {
    const r = request(downloadUrl, requestOpts)
      .on('response', (res) => {
        startedRequests += 1;

        if (res.statusCode !== 200) {
          return cb(new Error('Could not download ' + downloadUrl));
        }

        res.on('data', (chunk) => {
          progress += chunk.length;
          if (expectedRequests === startedRequests) {
            opts.progressCb(total, progress, chunk.length);
          }
        });

        total += parseInt(res.headers['content-length'], 10);

        cb(null, res);
      })
      .once('error', (error) => {
        cb(new Error('Could not download ' + downloadUrl + ': ' + error));
      });

    // initiate request
    r.end();
  }
}

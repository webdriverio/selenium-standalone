/* eslint-disable no-shadow */
module.exports = install;

const fs = require('fs');
const path = require('path');
const got = require('got');
const merge = require('lodash.merge');
const mapValues = require('lodash.mapvalues');

const computeDownloadUrls = require('./compute-download-urls');
const computeFsPaths = require('./compute-fs-paths');
const defaultConfig = require('./default-config')();
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
const { logError } = require('./log-error');

/**
 * used ONLY to deal with progress bar.
 * Only one download bar can be shown in the same time.
 */
const downloadStreams = new Map();

async function install(_opts) {
  const opts = checkArgs('Install API', _opts);

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
  if (process.platform === 'linux') {
    delete opts.drivers.chromiumedge;
  }

  const requestOpts = Object.assign({ timeout: 90000 }, opts.requestOpts);
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

  const urls = await computeDownloadUrls({
    seleniumVersion: opts.version,
    seleniumBaseURL: opts.baseURL,
    seleniumFullURL: opts.fullURL,
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

  Object.values(fsPaths)
    .filter(({ requireChmod }) => requireChmod)
    .forEach(({ installPath }) => {
      tasks.push(setDriverFilePermissions.bind(null, installPath));
    });

  // tasks should run one by one
  for (const t of tasks) {
    await t();
  }

  async function onlyInstallMissingFiles(opts) {
    const hash = await new Promise((resolve) => checksum(opts.to, resolve));
    const isLatest = await new Promise((resolve) => isUpToDate(opts.from, requestOpts, hash, resolve));

    // File already exists. Prevent download/installation.
    if (isLatest) {
      logger('---');
      logger('File from ' + opts.from + ' has already been downloaded');
      return;
    }

    return opts.installer({
      to: opts.to,
      from: opts.from,
    });
  }

  async function download(opts) {
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

    return Promise.all(installers.map((i) => onlyInstallMissingFiles(i)));
  }

  function installSelenium(opts) {
    return installSingleFile(opts.from, opts.to);
  }

  function installEdgeDr(opts) {
    if (path.extname(opts.from) === '.msi') {
      return downloadInstallerFile(opts.from, opts.to);
    }
    return installSingleFile(opts.from, opts.to);
  }

  async function installSingleFile(from, to) {
    const stream = await getDownloadStream(from);

    return new Promise((resolve, reject) =>
      stream
        .pipe(fs.createWriteStream(to))
        .once('error', (err) => reject(logError('installSingleFile', err)))
        .once('finish', resolve)
    );
  }

  async function downloadInstallerFile(from, to) {
    if (process.platform !== 'win32') {
      throw new Error('Could not install an `msi` file on the current platform');
    }

    const stream = await getDownloadStream(from);
    const installerFile = getTempFileName('installer.msi');

    await new Promise((resolve, reject) => {
      const msiWriteStream = fs
        .createWriteStream(installerFile)
        .once('error', (err) => reject(logError('downloadInstallerFile', err)));
      stream.pipe(msiWriteStream);

      msiWriteStream.once('finish', resolve);
    });

    return runInstaller(installerFile, from, to);
  }

  function installChromeDr(opts) {
    return installZippedFile(opts.from, opts.to);
  }

  function installIeDr(opts) {
    return installZippedFile(opts.from, opts.to);
  }

  function installFirefoxDr(opts) {
    // only windows build is a zip
    if (path.extname(opts.from) === '.zip') {
      return installZippedFile(opts.from, opts.to);
    }
    return installGzippedFile(opts.from, opts.to);
  }

  function installChromiumEdgeDr(opts) {
    return installZippedFile(opts.from, opts.to);
  }

  async function installGzippedFile(from, to) {
    const stream = await getDownloadStream(from);

    // Store downloaded compressed file
    await new Promise((resolve, reject) => {
      const gzipWriteStream = fs
        .createWriteStream(to)
        .once('error', (err) => reject(logError('installGzippedFile', err)));
      stream.pipe(gzipWriteStream);

      gzipWriteStream.once('finish', resolve);
    });

    return uncompressGzippedFile(from, to);
  }

  async function installZippedFile(from, to) {
    const stream = await getDownloadStream(from);

    await new Promise((resolve, reject) => {
      // Store downloaded compressed file
      const zipWriteStream = fs
        .createWriteStream(to)
        .once('error', (err) => reject(logError('installZippedFile', err)));
      stream.pipe(zipWriteStream);

      // Uncompress downloaded file
      zipWriteStream.once('finish', resolve);
    });

    return uncompressDownloadedFile(to);
  }

  async function getDownloadStream(downloadUrl) {
    let prevTransferred = 0;
    const downloadStream = got.stream(downloadUrl, requestOpts);
    return await new Promise((resolve, reject) => {
      downloadStream
        .once('response', () => {
          downloadStream.on('downloadProgress', ({ transferred, total }) => {
            const active = isDownloadActive();
            if (active) {
              downloadStreams.set(downloadStream, true);
            }
            if (downloadStreams.get(downloadStream)) {
              opts.progressCb(total, transferred, transferred - prevTransferred, downloadUrl, active);
            }
            prevTransferred = transferred;
          });
        })
        .once('finish', () => {
          resolve(downloadStream);
        })
        .once('end', () => {
          downloadStreams.delete(downloadStream);
        })
        .once('error', (err) => reject(logError('getDownloadStream', err, 'Could not download ' + downloadUrl)));
    });
  }
}

function isDownloadActive() {
  return !Array.from(downloadStreams.values()).includes(true);
}

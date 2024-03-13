/* eslint-disable no-shadow */
module.exports = install;

const { createWriteStream } = require('fs');
const { readFile, writeFile } = require('fs').promises;
const path = require('path');
const got = require('got');
const merge = require('lodash.merge');
const mapValues = require('lodash.mapvalues');

const { computeDownloadUrls } = require('./compute-download-urls');
const computeFsPaths = require('./compute-fs-paths');
const defaultConfig = require('./default-config')();
const noop = require('./noop');
const {
  uncompressDownloadedFile,
  asyncLogEnd,
  createDirs,
  setDriverFilePermissions,
  logInstallSummary,
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

/**
 * @typedef {(...args: any[]) => void} Logger
 */

/**
 * @typedef {(total: number, progress: number | undefined, chunk: any, url: string, reset: any) => void} ProgressCallback
 */

/**
 * @typedef {{
 *    basePath?: string
 *    baseURL?: string
 *    drivers?: import('./start').Drivers
 *    fullURL?: string
 *    logger?: Logger
 *    onlyDriver?: keyof import('./start').Drivers
 *    progressCb?: ProgressCallback
 *    proxy?: string
 *    requestOpts?: import('got').Options
 *    singleDriverInstall?: keyof import('./start').Drivers
 *    version?: string
 * }} InstallOptions
 */

/**
 * @param {InstallOptions} [_opts]
 */
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

  if (opts.singleDriverInstall || opts.onlyDriver) {
    const driver = opts.singleDriverInstall || opts.onlyDriver;
    const singleDriver = opts.drivers[driver];

    if (singleDriver) {
      opts.drivers = {};
      opts.drivers[driver] = singleDriver;
    }
  }

  if (process.platform !== 'win32') {
    delete opts.drivers.ie;
    delete opts.drivers.edge;
  }

  /** @type {import('got').Options} */
  const requestOpts = Object.assign({ timeout: 320000 }, opts.requestOpts);
  if (opts.proxy) {
    requestOpts.proxy = opts.proxy;
  }

  opts.progressCb = opts.progressCb || noop;

  logger('----------');
  logger('selenium-standalone installation starting');
  logger('----------');
  logger('');

  const fsPaths = await computeFsPaths({
    seleniumVersion: opts.version,
    drivers: opts.drivers,
    basePath: opts.basePath,
  });

  if (opts.onlyDriver) {
    delete fsPaths.selenium;
  }
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
      opts: opts,
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
    let file;
    try {
      file = await readFile(opts.to);
    } catch (err) {
      // ENOENT means not found which is ok. But anything else re-raise
      if (err.code != 'ENOENT') {
        throw err;
      }
    }
    const isLatest = await isUpToDate(opts.from, file, opts.to);

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
    const installers = [];

    if (!opts.opts.onlyDriver) {
      installers.push({
        installer: installSelenium,
        from: opts.urls.selenium,
        to: opts.fsPaths.selenium.downloadPath,
      });
    }

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

    return writeDownloadStream(stream, to);
  }

  async function downloadInstallerFile(from, to) {
    if (process.platform !== 'win32') {
      throw new Error('Could not install an `msi` file on the current platform');
    }

    const stream = await getDownloadStream(from);
    const installerFile = getTempFileName('installer.msi');

    await writeDownloadStream(stream, installerFile, `${to}.etag`);
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

    await writeDownloadStream(stream, to);
    return uncompressGzippedFile(from, to);
  }

  async function installZippedFile(from, to) {
    const stream = await getDownloadStream(from);

    await writeDownloadStream(stream, to);
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
        .once('error', (err) => {
          if (err.code === 'ERR_NON_2XX_3XX_RESPONSE' && downloadUrl.includes('edge')) {
            reject(
              logError(
                'getDownloadStream',
                err,
                'It may be due to the specified edge driver version ' +
                  downloadUrl.split('/')[3] +
                  ' is unavailable for current platform. Try downloading a different version of edge driver '
              )
            );
          } else {
            reject(logError('getDownloadStream', err, 'Could not download ' + downloadUrl));
          }
          throw new Error('Could not download ' + downloadUrl);
        });
    });
  }

  async function writeDownloadStream(stream, to, etagPath = `${to}.etag`) {
    const writeEtagPromise = new Promise((resolve, reject) => {
      stream.once('response', async (response) => {
        try {
          await writeFile(etagPath, response.headers.etag);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });

    const writeFilePromise = new Promise((resolve, reject) => {
      const writeStream = createWriteStream(to).once('error', (err) => reject(logError('writeDownloadStream', err)));
      stream.pipe(writeStream);

      writeStream.once('finish', resolve);
    });

    return Promise.all([writeEtagPromise, writeFilePromise]);
  }

  return { fsPaths, urls, opts };
}

function isDownloadActive() {
  return !Array.from(downloadStreams.values()).includes(true);
}

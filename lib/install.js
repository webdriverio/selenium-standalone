module.exports = install;

var async = require('async');
var debug = require('debug')('selenium-standalone:lib/install');
var fs = require('fs');
var merge = require('lodash').merge;
var mkdirp = require('mkdirp');
var path = require('path');
var request = require('request');
var util = require('util');

var computePaths = require('./compute-paths');
var defaultConfig = require('./default-config');

function install(opts, cb) {
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  if (!opts.version) {
    opts.version = defaultConfig.version;
  }

  opts.drivers = merge(defaultConfig.drivers, opts.drivers || {});

  var paths = computePaths({
    version: opts.version,
    drivers: opts.drivers
  });

  async.series([
    createDirs.bind(null, paths),
    download.bind(null, {
      version: opts.version,
      drivers: opts.drivers,
      paths: paths
    }),
    chmodChromeDr.bind(null, paths.chrome)
  ], cb);
}

function createDirs(paths, cb) {
  async.eachSeries([paths.selenium, paths.chrome, paths.ie].map(basePath), mkdirp, cb);
}

function basePath(fullPath) {
  return path.dirname(fullPath);
}

function download(opts, cb) {
  var steps = [
    installChromeDr.bind(null, {
      path: opts.paths.chrome,
      driver: opts.drivers.chrome
    }),
    installSelenium.bind(null, {
      path: opts.paths.selenium,
      version: opts.version
    })
  ];

  if (process.platform === 'win32') {
    steps.push(installIeDr.bind(null, {
      path: opts.paths.ie,
      seleniumVersion: opts.version,
      driver: opts.drivers.ie
    }));
  }

  async.parallel(steps, cb);
}

function installSelenium(opts, cb) {
  var seleniumStandaloneUrl =
    'http://selenium-release.storage.googleapis.com/%s/selenium-server-standalone-%s.jar';

  var dl = util.format(seleniumStandaloneUrl,
    opts.version.slice(0, opts.version.lastIndexOf('.')),
    opts.version);

  getDownloadStream(dl, function(err, stream) {
    if (err) {
      return cb(err);
    }

    stream
      .pipe(fs.createWriteStream(opts.path))
      .once('error', cb.bind(null, new Error('Could not write to ' + opts.path)))
      .once('finish', cb);
  });
}

function chmodChromeDr(where, cb) {
  debug('chmod+x chromedriver');
  fs.chmod(where, '0755', cb);
}

function installChromeDr(opts, cb) {
  var chromedriverUrl = 'http://chromedriver.storage.googleapis.com/%s/chromedriver_%s.zip';
  var platform = getChromeDriverPlatform(opts.driver.arch);

  if (platform instanceof Error) {
    return cb(platform);
  }

  var downloadUrl = util.format(chromedriverUrl, opts.driver.version, platform);

  installZippedFile(opts.path, downloadUrl, cb);
}

function installIeDr(opts, cb) {
  var ieDriverUrl = 'http://selenium-release.storage.googleapis.com/%s/IEDriverServer_%s_%s.zip';
  var platform = getIeDriverPlatform(opts.driver.arch);
  if (platform instanceof Error) {
    return cb(platform);
  }

  var downloadUrl = util.format(
    ieDriverUrl,
    opts.seleniumVersion.slice(0, opts.driver.version.lastIndexOf('.')),
    platform,
    opts.driver.version
  );

  installZippedFile(opts.path, downloadUrl, cb);
}

function installZippedFile(to, url, cb) {
  getDownloadStream(url, function(err, stream) {
    if (err) {
      return cb(err);
    }

    var unzip = require('unzip');

    debug('Unzipping ' + url);

    stream
      .pipe(unzip.Parse())
      .once('entry', function(file) {
        file
          .pipe(fs.createWriteStream(to))
          .once('error', cb.bind(null, new Error('Could not write to ' + to)))
          .once('finish', cb);
      })
      .once('error', cb.bind(null, new Error('Could not unzip ' + url)));
  });
}

function getDownloadStream(downloadUrl, cb) {
  var r = request(downloadUrl)
    .on('response', function(res) {
      debug('Downloading ' + downloadUrl, res.statusCode);

      if (res.statusCode !== 200) {
        return cb(new Error('Could not download ' + downloadUrl));
      }

      cb(null, res);
    })
    .once('error', cb.bind(null, new Error('Could not download ' + downloadUrl)));

  // initiate request
  r.end();
}

function getChromeDriverPlatform(asked) {
  var platform;

  if (process.platform === 'linux') {
    platform = 'linux' + ( asked === 'x64' ? '64' : '32' );
  } else if (process.platform === 'darwin') {
    platform = 'mac32';
  } else if (process.platform === 'win32') {
    platform = 'win32';
  } else {
    return new Error('Platform not supported');
  }

  return platform;
}

function getIeDriverPlatform(asked) {
  var platform;

  if (asked === 'ia32') {
    platform = 'Win32';
  } else if (asked === 'x64') {
    platform = 'x64';
  } else {
    return new Error('Architecture not supported');
  }

  return platform;
}

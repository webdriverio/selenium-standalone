module.exports = install;

var async = require('async');
var fs = require('fs');
var merge = require('lodash').merge;
var mkdirp = require('mkdirp');
var path = require('path');
var request = require('request');

var computeDownloadUrls = require('./compute-download-urls');
var computePaths = require('./compute-paths');
var defaultConfig = require('./default-config');
var noop = require('./noop');

function install(opts, cb) {
  var total = 0;
  var progress = 0;
  var startedRequests = 0;
  var expectedRequests = 3;

  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  var logger = opts.logger || noop;

  if (!opts.version) {
    opts.version = defaultConfig.version;
  }

  opts.progressCb = opts.progressCb || noop;

  opts.drivers = merge(defaultConfig.drivers, opts.drivers || {});

  logger('----------');
  logger('selenium-standalone installation starting');
  logger('----------');
  logger('');

  var paths = computePaths({
    seleniumVersion: opts.version,
    drivers: opts.drivers
  });

  var urls = computeDownloadUrls({
    seleniumVersion: opts.version,
    drivers: opts.drivers,
  });

  if (process.platform !== 'win32') {
    delete paths.ie;
    delete urls.ie;
    expectedRequests -= 1;
  }

  logInstallSummary(logger, paths, urls);

  async.series([
    createDirs.bind(null, paths),
    download.bind(null, {
      urls: urls,
      paths: paths
    }),
    chmodChromeDr.bind(null, paths.chrome),
    asyncLogEnd.bind(null, logger),
  ], cb);

  function download(opts, cb) {
    var steps = [
      installSelenium.bind(null, {
        from: opts.urls.selenium,
        to: opts.paths.selenium
      }),
      installChromeDr.bind(null, {
        from: opts.urls.chrome,
        to: opts.paths.chrome
      })
    ];

    if (process.platform === 'win32') {
      steps.push(installIeDr.bind(null, {
        from: opts.urls.ie,
        to: opts.paths.ie
      }));
    }

    async.parallel(steps, cb);
  }

  function installSelenium(opts, cb) {
    getDownloadStream(opts.from, function(err, stream) {
      if (err) {
        return cb(err);
      }

      stream
        .pipe(fs.createWriteStream(opts.to))
        .once('error', cb.bind(null, new Error('Could not write to ' + opts.to)))
        .once('finish', cb);
    });
  }

  function installChromeDr(opts, cb) {
    installZippedFile(opts.from, opts.to, cb);
  }

  function installIeDr(opts, cb) {
    installZippedFile(opts.from, opts.to, cb);
  }

  function installZippedFile(from, to, cb) {
    var unzip = require('unzip');

    getDownloadStream(from, function(err, stream) {
      if (err) {
        return cb(err);
      }

      stream
        .pipe(unzip.Parse())
        .once('entry', function(file) {
          file
            .pipe(fs.createWriteStream(to))
            .once('error', cb.bind(null, new Error('Could not write to ' + to)))
            .once('finish', cb);
        })
        .once('error', cb.bind(null, new Error('Could not unzip ' + from)));
    });
  }

  function getDownloadStream(downloadUrl, cb) {
    var r = request(downloadUrl)
      .on('response', function(res) {
        startedRequests += 1;

        if (res.statusCode !== 200) {
          return cb(new Error('Could not download ' + downloadUrl));
        }

        res.on('data', function(chunk) {
          progress += chunk.length;
          updateProgressPercentage(chunk.length);
        });

        total += parseInt(res.headers['content-length'], 10);

        cb(null, res);
      })
      .once('error', cb.bind(null, new Error('Could not download ' + downloadUrl)));

    // initiate request
    r.end();
  }

  function updateProgressPercentage(chunk) {
    if (expectedRequests === startedRequests) {
      opts.progressCb(total, progress, chunk);
    }
  }
}

function asyncLogEnd(logger, cb) {
  setImmediate(function() {
    logger('');
    logger('');
    logger('-----');
    logger('selenium-standalone installation finished');
    logger('-----');
    cb();
  });
}

function createDirs(paths, cb) {
  async.eachSeries([paths.selenium, paths.chrome, paths.ie].map(basePath), mkdirp, cb);
}

function basePath(fullPath) {
  return path.dirname(fullPath);
}

function chmodChromeDr(where, cb) {
  fs.chmod(where, '0755', cb);
}

function logInstallSummary(logger, paths, urls) {
  ['selenium', 'chrome', 'ie'].forEach(function log(name) {
    if (!paths[name]) {
      return;
    }

    logger('---');
    logger(name + ' install:');
    logger('from: ' + urls[name]);
    logger('to: ' + paths[name]);
  });

  // logger('');
}

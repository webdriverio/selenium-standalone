var conf = require('./conf.js');
var async = require('async');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var path = require('path');

async.series([
  setup,
  download,
  chmodChromeDr.bind(null, conf.chromeDr.path)
], end);

function setup(cb) {
  async.series([
    rimraf.bind(null, path.join(__dirname, '.selenium')),
    mkdirp.bind(null, path.dirname(conf.selenium.path))
  ], cb);
}

function download(cb) {
  async.parallel([
    installChromeDr.bind(null, conf.chromeDr.path, conf.chromeDr.v),
    installSelenium.bind(null, conf.selenium.path, conf.selenium.v)
  ], cb)
}

function end(err) {
  console.log('Installation finished');
  if (err) {
    throw err
  }
}

function installSelenium(to, version, cb) {
  var seleniumStandaloneUrl =
    'http://selenium-release.storage.googleapis.com/%s/selenium-server-standalone-%s.jar';

  var dl = require('util').format(seleniumStandaloneUrl,
    version.slice(0, version.lastIndexOf('.')),
    version);

  getDownloadStream(dl, function(err, stream) {
    if (err) {
      return cb(err);
    }

    stream
      .pipe(require('fs').createWriteStream(to))
      .once('error', cb.bind(null, new Error('Could not write to ' + to)))
      .once('finish', cb);
  });
}

function chmodChromeDr(where, cb) {
  console.log('chmod+x chromedriver');
  require('fs').chmod(where, 0755, cb);
}

function installChromeDr(to, version, cb) {
  var path = require('path');
  var util = require('util');

  var chromedriverUrl = 'http://chromedriver.storage.googleapis.com/%s/chromedriver_%s.zip';
  var platform = getChromeDriverPlatform();

  if(platform instanceof Error) {
    return cb(platform);
  }

  var dl = util.format(chromedriverUrl, version, platform);

  getDownloadStream(dl, function(err, stream) {
    if (err) {
      return cb(err);
    }

    var unzip = require('unzip');

    console.log('Unzipping ' + dl);

    stream
      .pipe(require('unzip').Parse())
      .once('entry', function(file) {
        file
          .pipe(require('fs').createWriteStream(to))
          .once('error', cb.bind(null, new Error('Could not write to ' + to)))
          .once('finish', cb)
      })
      .once('error', cb.bind(null, new Error('Could not unzip ' + dl)))
  })
}

function getDownloadStream(dl, cb) {
  var r =
    require('http')
      .request(dl, function(res) {
        console.log('Downloading ' + dl);

        if (res.statusCode !== 200) {
          return cb(new Error('Could not download ' + dl));
        }

        cb(null, res);
      })
      .once('error', cb.bind(null, new Error('Could not download ' + dl)))

  // initiate request
  r.end();
}

function getChromeDriverPlatform() {
  var platform;

  if (process.platform === 'linux') {
    platform = 'linux' + ( process.arch === 'x64' ? '64' : '32' );
  } else if (process.platform === 'darwin') {
    platform = 'mac32';
  } else if (process.platform === 'win32') {
    platform = 'win32'
  } else {
    return new Error('Platform not supported');
  }

  return platform;
}
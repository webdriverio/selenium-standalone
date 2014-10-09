var async = require('async');
var fs = require('fs');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var path = require('path');
var util = require('util');

var conf = require('./conf.js');

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
  var steps = [
    installChromeDr.bind(null, conf.chromeDr.path, conf.chromeDr.v),
    installSelenium.bind(null, conf.selenium.path, conf.selenium.v)
  ];

  if (process.platform === 'win32') {
    steps.push(installIeDr.bind(null, conf.ieDr.path, conf.selenium.v, conf.ieDr.v));
  }

  async.parallel(steps, cb);
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

  var dl = util.format(seleniumStandaloneUrl,
    version.slice(0, version.lastIndexOf('.')),
    version);

  getDownloadStream(dl, function(err, stream) {
    if (err) {
      return cb(err);
    }

    stream
      .pipe(fs.createWriteStream(to))
      .once('error', cb.bind(null, new Error('Could not write to ' + to)))
      .once('finish', cb);
  });
}

function chmodChromeDr(where, cb) {
  console.log('chmod+x chromedriver');
  fs.chmod(where, 0755, cb);
}

function installChromeDr(to, version, cb) {
  var chromedriverUrl = 'http://chromedriver.storage.googleapis.com/%s/chromedriver_%s.zip';
  var platform = getChromeDriverPlatform();

  if(platform instanceof Error) {
    return cb(platform);
  }

  var downloadUrl = util.format(chromedriverUrl, version, platform);

  installZippedFile(to, downloadUrl, cb);
}

function installIeDr(to, seleniumVersion, version, cb) {
  var ieDriverUrl = 'http://selenium-release.storage.googleapis.com/%s/IEDriverServer_%s_%s.zip';
  var platform = getIeDriverPlatform();
  if (platform instanceof Error) {
    return cb(platform);
  }

  var downloadUrl = util.format(
    ieDriverUrl,
    //
    seleniumVersion.slice(0, version.lastIndexOf('.')),
    platform,
    version
  );

  installZippedFile(to, downloadUrl, cb);
}

function installZippedFile(to, url, cb) {
  getDownloadStream(url, function(err, stream) {
    if (err) {
      return cb(err);
    }

    var unzip = require('unzip');

    console.log('Unzipping ' + url);

    stream
      .pipe(unzip.Parse())
      .once('entry', function(file) {
        file
          .pipe(fs.createWriteStream(to))
          .once('error', cb.bind(null, new Error('Could not write to ' + to)))
          .once('finish', cb)
      })
      .once('error', cb.bind(null, new Error('Could not unzip ' + url)))
  })
}

function getDownloadStream(downloadUrl, cb) {
  var http = require('http');

  var proxy = process.env.HTTP_PROXY || process.env.http_proxy;

  var requestOpts = downloadUrl;

  if (proxy) {
    var regexp = /(https?:\/\/)?([^:/]*)/;
    requestOpts = {
      host: proxy.match(regexp)[2],
      port: proxy.match(/:(\d+)/)[1] || 8080,
      path: downloadUrl,
      headers: {
        Host: downloadUrl.match(regexp)[2]
      }
    };
  }

  var r =
    http
      .request(requestOpts, function(res) {
        console.log('Downloading ' + downloadUrl, res.statusCode);

        if (res.statusCode === 302 && res.headers.location) {
          r.abort();
          return getDownloadStream(res.headers.location, cb);
        }

        if (res.statusCode !== 200) {
          return cb(new Error('Could not download ' + downloadUrl));
        }

        cb(null, res);
      })
      .once('error', cb.bind(null, new Error('Could not download ' + downloadUrl)))

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

function getIeDriverPlatform() {
  if (conf.ieDr.arch === 'ia32') {
    return 'Win32';
  } else if (conf.ieDr.arch === 'x64') {
    return 'x64';
  } else {
    return new Error('Architecture not supported');
  }
}

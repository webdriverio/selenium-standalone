var conf = require('./conf.js');
var async = require('async');

async.parallel([
  installChromeDr.bind(null, conf.chromeDr.path, conf.chromeDr.v),
  installSelenium.bind(null, conf.selenium.path, conf.selenium.v)
], function(err) {
  if (err) {
    throw err
  }
});

function installSelenium(to, version, cb) {
  var seleniumStandaloneUrl = 'https://selenium.googlecode.com/files/selenium-server-standalone-%s.jar'
  var util = require('util');
  var dl = util.format(seleniumStandaloneUrl, version);
  var request = require('request');
  var fstream = require('fstream');
  var destination = fstream.Writer({
    path: to,
    type: 'File'
  });

  destination.on('error', cb);
  destination.on('close', cb);

  console.log('Downloading ' + dl);
  request(dl)
    .on('error', cb)
    .pipe(destination);
}

function installChromeDr(to, version, cb) {
  var path = require('path');
  var util = require('util');

  var chromedriverUrl = 'https://chromedriver.googlecode.com/files/chromedriver_%s_%s.zip';
  var platform = getChromeDriverPlatform();

  if(platform instanceof Error) {
    return cb(platform);
  }

  var dl = util.format(chromedriverUrl, platform, version);

  console.log('Downloading ' + dl);
  downloadAndExtractZip(dl, path.dirname(to), function(err) {
    if (err) {
      return cb(err);
    }

    var fs = require('fs');
    fs.chmod(to, '0755', cb);
  });
}

function downloadAndExtractZip(from, to, cb) {
  var fstream = require('fstream');
  var request = require('request');
  var unzip = require('unzip');
  var destination = fstream.Writer({
    path: to,
    type: 'Directory'
  });

  destination.on('close', cb);
  destination.on('error', cb);

  request(from)
    .on('error', cb)
    .pipe(unzip.Parse())
    .pipe(destination)
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
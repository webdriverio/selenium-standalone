var conf = require('./conf.js');
var async = require('async');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var path = require('path');

async.series([
  setup,
  download
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
    installIExploreDr.bind(null, conf.iexploreDr.path, conf.iexploreDr.v),
    installSelenium.bind(null, conf.selenium.path, conf.selenium.v)

  ], cb)
}

function end(err) {
  if (err) {
    throw err
  }
}

function installSelenium(to, version, cb) {
  var seleniumStandaloneUrl = 'https://selenium.googlecode.com/files/selenium-server-standalone-%s.jar'
  var util = require('util');
  var dl = util.format(seleniumStandaloneUrl, version);
  var request = require('request');
  var fs = require('fs');
  var destination = fs.createWriteStream(to);

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
  var request = require('request');

  var chromedriverUrl = 'https://chromedriver.googlecode.com/files/chromedriver_%s_%s.zip';
  var platform = getChromeDriverPlatform();

  if(platform instanceof Error) {
    return cb(platform);
  }

  var dl = util.format(chromedriverUrl, platform, version);

  console.log('Downloading ' + dl);
  downloadAndExtractZip(dl, to, function(err) {
    if (err) {
      return cb(err);
    }

    if(platform != 'win32')
    {
      var fs = require('fs');
      fs.chmod(to, '0755', cb);
    }  
  });
}


function installIExploreDr(to, version, cb){
  var path = require('path');
  var util = require('util');
  var fs = require('fs');
  var unzip = require('unzip');
  var request = require('request');
  var iexploredriverUrl = 'https://selenium.googlecode.com/files/IEDriverServer_%s_%s.zip';
  var platform = getIExploreDriverPlatform();

  if(platform == null) {
    return;
  }

  var dl = util.format(iexploredriverUrl, plafform, version);
  console.log('Downloading ' + dl);

  downloadAndExtractZip(dl, to, function(err) {
    if (err) {
      return cb(err);
    }
  });

}

function downloadAndExtractZip(from, to, cb) {
  var fs = require('fs');
  var request = require('request');
  var unzip = require('unzip');
  var destination = fs.createWriteStream(to);

  destination.on('close', cb);
  destination.on('error', cb);

  request(from)
    .on('error', cb)
    .pipe(unzip.Parse())
    .once('entry', function(file) {
      file.pipe(destination);
    })
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

function getIExploreDriverPlatform(){
  var platform;


  if (process.platform === 'win64') {
    platform = 'Win64';
  } else if (process.platform === 'win32') {
    platform = 'Win32'
  } else {
    platform=null;
  }

  return platform;

}


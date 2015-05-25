module.exports = start;

var merge = require('lodash').merge;
var spawn = require('child_process').spawn;

var which = require('which');

var checkPathsExistence = require('./check-paths-existence');
var checkStarted = require('./check-started');
var computeFsPaths = require('./compute-fs-paths');
var defaultConfig = require('./default-config');
var noop = require('./noop');

function start(opts, cb) {
  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  if (!opts.seleniumArgs) {
    opts.seleniumArgs = [];
  }

  if (!opts.version) {
    opts.version = defaultConfig.version;
  }

  if (!opts.spawnCb) {
    opts.spawnCb = noop;
  }

  opts.drivers = merge(defaultConfig.drivers, opts.drivers || {});

  var fsPaths = computeFsPaths({
    seleniumVersion: opts.version,
    drivers: opts.drivers
  });

  if (typeof cb !== 'function') {
    throw new Error('You must provide a callback when starting selenium');
  }

  // programmatic use, did not give javaPath
  if (!opts.javaPath) {
    opts.javaPath = which.sync('java');
  }

  var args = [
    '-jar',
    fsPaths.selenium.installPath,
    '-Dwebdriver.chrome.driver=' + fsPaths.chrome.installPath
  ];

  if (process.platform === 'win32') {
    args.push('-Dwebdriver.ie.driver=' + fsPaths.ie.installPath);
  } else {
    delete fsPaths.ie;
  }

  args = args.concat(opts.seleniumArgs);

  checkPathsExistence(getInstallPaths(fsPaths), function(err) {
    if (err) {
      cb(err);
      return;
    }

    var selenium = spawn(opts.javaPath, args, opts.spawnOptions);

    // Add empty handler to stdout and stderr so the buffers can be flushed
    if (selenium.stdout && selenium.stderr) {
      selenium.stdout.on('data', noop);
      selenium.stderr.on('data', noop);
    }

    opts.spawnCb(selenium);

    selenium.on('exit', errorIfNeverStarted);

    checkStarted(args, function started(err) {
      selenium.removeListener('exit', errorIfNeverStarted);

      if (err) {
        cb(err);
        return;
      }

      cb(null, selenium);
    });

    function errorIfNeverStarted() {
      cb(new Error('Selenium exited before it could start'));
    }
  });
}

function getInstallPaths(fsPaths) {
  return Object.keys(fsPaths).map(function(name) {
    return fsPaths[name].installPath;
  });
}

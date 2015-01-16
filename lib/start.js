module.exports = start;

var merge = require('lodash').merge;
var spawn = require('child_process').spawn;

var checkPathsExistence = require('./check-paths-existence');
var checkStarted = require('./check-started');
var computePaths = require('./compute-paths');
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

  var paths = computePaths({
    seleniumVersion: opts.version,
    drivers: opts.drivers
  });

  if (typeof cb !== 'function') {
    throw new Error('You must provide a callback when starting selenium');
  }

  var args = [
    '-jar',
    paths.selenium,
    '-Dwebdriver.chrome.driver=' + paths.chrome
  ];

  if (process.platform === 'win32') {
    args.push('-Dwebdriver.ie.driver=' + paths.ie);
  } else {
    delete paths.ie;
  }

  args = args.concat(opts.seleniumArgs);

  checkPathsExistence(paths, function(err) {
    if (err) {
      cb(err);
      return;
    }

    var selenium = spawn('java', args, opts.spawnOptions);

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

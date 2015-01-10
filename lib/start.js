module.exports = start;

var merge = require('lodash').merge;
var spawn = require('child_process').spawn;

var checkStarted = require('./check-started');
var computePaths = require('./compute-paths');
var defaultConfig = require('./default-config');

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

  opts.drivers = merge(defaultConfig.drivers, opts.drivers || {});

  var paths = computePaths({
    version: opts.version,
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
  }

  args = args.concat(opts.seleniumArgs);

  var selenium = spawn('java', args, opts.spawnOptions);

  checkStarted(args, function started(err) {
    if (err) {
      cb(err);
      return;
    }

    cb(null, selenium);
  });
}

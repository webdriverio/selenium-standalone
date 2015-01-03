var spawn = require('child_process').spawn;
var conf = require( './conf.js' );
var async = require( 'async' );
var whereis = require( 'whereis' );
var path = require( 'path' );
var request = require('request').defaults({json: true});

module.exports = standalone;

var killEvents = ['exit', 'SIGTERM', 'SIGINT'];
var processes = [];
var registered = false;

/**
 * Get a standalone selenium server running with
 * chromedriver available
 * @param  {Object} spawnOptions={ stdio: 'inherit' }
 * @param  {string[]} seleniumArgs=[]
 * @param  {Function} cb=function() {}
 * @return {ChildProcess}
 */
function standalone(spawnOptions, seleniumArgs, cb) {

  if (!registered) {
    killEvents.forEach(listenAndKill);
    registered = true;
  }

  if (typeof spawnOptions === 'function') {
    cb = spawnOptions;
    spawnOptions = null;
  }

  if (typeof seleniumArgs === 'function') {
    cb = seleniumArgs;
    seleniumArgs = null;
  }

  spawnOptions = spawnOptions || { stdio: 'inherit' };
  seleniumArgs = seleniumArgs || [];

  var args = [
    '-jar',
    conf.selenium.path,
    '-Dwebdriver.chrome.driver=' + conf.chromeDr.path
  ];

  if (process.platform === 'win32') {
    args.push('-Dwebdriver.ie.driver=' + conf.ieDr.path);
  }

  args = args.concat(seleniumArgs);

  var selenium = spawn('java', args, spawnOptions);

  processes.push(selenium);

  if (cb) {
    checkStarted(function started(err) {
      if (err) {
        cb(err);
        return;
      }

      cb(null, selenium);
    });
  }

  return selenium;
}

function checkStarted(cb) {
  var retries = 0;
  var maxRetries = 60;
  var retryInterval = 200;

  function hasStarted() {
    retries++;

    if (retries > maxRetries) {
      cb(new Error('Unable to connect to selenium'));
      return;
    }

    request(conf.selenium.hub, function (err, resp) {
      if (resp && resp.statusCode === 200) {
        cb(null);
        return;
      }

      setTimeout(hasStarted, retryInterval);
    });
  };

  hasStarted();
}

function kill() {
  var process;
  while (process = processes.shift()) {
    process.kill('SIGTERM');
  }

  killEvents.forEach(unregister);
}

function listenAndKill(evName) {
  process.on(evName, kill);
}

function unregister(evName) {
  process.removeListener(evName, kill);
}

// backward compat with original programmatic PR
// https://github.com/vvo/selenium-standalone/pull/4
standalone.start = standalone;

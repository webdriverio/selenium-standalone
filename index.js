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

var RETRIES = 60;
var RETRY_INTERVAL = 1000;

/**
 * Get a standalone selenium server running with
 * chromedriver available
 * @param  {Object} spawnOptions={ stdio: 'inherit' }
 * @param  {string[]} seleniumArgs=[]
 * @param  {Function} callback=function() {}
 * @return {ChildProcess}
 */
function standalone(spawnOptions, seleniumArgs, callback) {

  if (!registered) {
    killEvents.forEach(listenAndKill);
    registered = true;
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

  checkStarted(function(err) {
    if (err) {
      callback(err);
    } else {
      callback(null, selenium);
    }
  });

  return selenium;
}

function checkStarted(callback) {

  var retries = 0;
  var started = function () {

    if (++retries > RETRIES) {
      return callback('Unable to connect to selenium');
    }

    request(conf.selenium.hub, function (err, resp) {
      if (resp && resp.statusCode === 200) {
        callback(null);
      } else {
        setTimeout(started, RETRY_INTERVAL);
      }
    });
  };

  started();
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

var spawn = require('child_process').spawn;
var conf = require( './conf.js' );
var async = require( 'async' );
var whereis = require( 'whereis' );

module.exports = standalone;

/**
 * Get a standalone selenium server running with
 * chromedriver available
 * @param  {Object} spawnOptions={ stdio: 'inherit' }
 * @param  {string[]} seleniumArgs=[]
 * @return {ChildProcess}
 */
function standalone(spawnOptions, seleniumArgs) {
  spawnOptions = spawnOptions || { stdio: 'inherit' };
  seleniumArgs = seleniumArgs || [];

  var args = [
    '-jar',
    conf.selenium.path,
    '-Dwebdriver.chrome.driver=' + conf.chromeDr.path
  ].concat(seleniumArgs);

  var selenium = spawn('java', args, spawnOptions);

  ['exit', 'SIGTERM', 'SIGINT'].forEach(function listenAndKill(evName) {
    process.on(evName, kill);
  });

  function kill() {
    // we may not have started the selenium process at this stage
    if (selenium) {
      selenium.kill('SIGTERM');
      selenium = null;
    }
  }

  return selenium;
}

// backward compat with original programmatic PR
// https://github.com/vvo/selenium-standalone/pull/4
standalone.start = standalone;

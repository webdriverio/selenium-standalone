var spawn = require('child_process').spawn;
var conf = require('./conf.js');

module.exports = standalone;

/**
 * Get a standalone selenium server running with
 * chromedriver available
 * @param  {Object} spawnOptions={ stdio: 'inherit' }
 * @param  {string[]} seleniumArgs=[]
 * @return {ChildProcess}
 */
function standalone(spawnOptions, seleniumArgs) {
  process.on('SIGTERM', kill);

  spawnOptions = spawnOptions || { stdio: 'inherit' };
  seleniumArgs = seleniumArgs || [];

  var args = [
    '-jar',
    conf.selenium.path,
    '-Dwebdriver.chrome.driver=' + conf.chromeDr.path
  ].concat(seleniumArgs);

  var selenium = spawn('java', args, spawnOptions);

  function kill() {
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
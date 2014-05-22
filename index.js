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
  var selenium = null;

  async.series([
    findJava,
    start
  ]);

  return (selenium);

  function findJava(cb) {
    function onWhere(err, res) {
      if (err) {
        console.error(err);
        return cb(err);
      }
      cb();
    }
    whereis('java', onWhere);
  };

  function start(cb) {
    process.on('SIGTERM', kill);

    spawnOptions = spawnOptions || { stdio: 'inherit' };
    seleniumArgs = seleniumArgs || [];

    var args = [
      '-jar',
      conf.selenium.path,
      '-Dwebdriver.chrome.driver=' + conf.chromeDr.path
    ].concat(seleniumArgs);

    selenium = spawn('java', args, spawnOptions);

    function kill() {
      if (selenium) {
        selenium.kill('SIGTERM');
        selenium = null;
      }
    }
  }
}

// backward compat with original programmatic PR
// https://github.com/vvo/selenium-standalone/pull/4
standalone.start = standalone;
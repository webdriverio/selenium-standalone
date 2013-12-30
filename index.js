var spawn = require('child_process').spawn;
var conf = require('./conf.js');

function start(spawnOptions) {
  process.on('SIGINT', kill);
  process.on('exit', kill);

  var args = [
    '-jar',
    conf.selenium.path,
    '-Dwebdriver.chrome.driver=' + conf.chromeDr.path
  ].concat(process.argv.slice(2));

  var selenium = spawn('java', args, spawnOptions || { stdio: 'inherit' });

  function kill() {
    if (selenium) {
      selenium.kill('SIGKILL');
      selenium = null;
    }
  }

  return selenium;
}

exports.start = start;
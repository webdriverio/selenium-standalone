module.exports = checkStarted;

var request = require('request').defaults({json: true});
var URI = require('URIjs');

function checkStarted(seleniumArgs, cb) {
  var retries = 0;

  var hub = getSeleniumHub(seleniumArgs);

  var retryInterval = 200;
  // server has one minute to start
  var maxRetries = 60 * 1000 / retryInterval;

  function hasStarted() {
    retries++;

    if (retries > maxRetries) {
      cb(new Error('Unable to connect to selenium'));
      return;
    }

    request(hub, function (err, res) {
      if (err || res.statusCode !== 200) {
        setTimeout(hasStarted, retryInterval);
        return;
      }

      cb(null);
    });
  }

  hasStarted();
}

function getSeleniumHub(seleniumArgs) {
  var port = 4444;
  var hostname = 'localhost';
  var portArg = seleniumArgs.indexOf('-port');
  var hubArg = seleniumArgs.indexOf('-hub');

  if (hubArg !== -1) {
    hubURI = new URI(seleniumArgs[hubArg + 1]);
    hostname = hubURI.hostname();
    port = hubURI.port();
  }

  if (portArg !== -1) {
    port = seleniumArgs[portArg + 1];
  }

  return 'http://' + hostname + ':' + port + '/wd/hub/status';
}

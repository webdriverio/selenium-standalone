module.exports = checkStarted;

var request = require('request').defaults({json: true});
var getSeleniumHub = require('./get-selenium-hub.js');

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

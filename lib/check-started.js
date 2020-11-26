module.exports = checkStarted;

const request = require('request').defaults({ json: true });
const statusUrl = require('./get-selenium-status-url.js');

function checkStarted(seleniumArgs, cb) {
  let retries = 0;
  const hub = statusUrl.getSeleniumStatusUrl(seleniumArgs);
  // server has one minute to start
  const retryInterval = 200;
  const maxRetries = (60 * 1000) / retryInterval;

  function hasStarted() {
    retries++;

    if (retries > maxRetries) {
      cb(new Error('Unable to connect to selenium'));
      return;
    }

    request(hub, (err, res) => {
      if (err || res.statusCode !== 200) {
        setTimeout(hasStarted, retryInterval);
        return;
      }
      cb(null);
    });
  }

  setTimeout(hasStarted, 500);
}

module.exports = checkStarted;

const got = require('got');
var statusUrl = require('./get-selenium-status-url.js');

function checkStarted(seleniumArgs, cb) {
  const seleniumStatusUrl = statusUrl.getSeleniumStatusUrl(seleniumArgs);
  const options = {
    timeout: 1000,
    retry: {
      limit:300,
      calculateDelay: ({attemptCount, retryOptions, error, computedValue}) => {
        // server has one minute to start
        // retry to connect every 200 ms up until the limit of 300 attempts is reached
        return 200
      }
    }
  };
  (async () => {
      try {
          const res = await got(seleniumStatusUrl, options);
          if(res.statusCode !== 200) {
            return cb(new Error(`Error processing request: ${res.statusCode}`));
          }
          return cb(null);
      } catch (error) {
          return cb(new Error(`Unable to connect to selenium. Error: ${error}`));
      }
  })();
}

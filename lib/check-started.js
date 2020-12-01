module.exports = checkStarted;

const got = require('got');
const statusUrl = require('./get-selenium-status-url.js');
const { sleep } = require('./delay');

async function checkStarted(seleniumArgs) {
  const seleniumStatusUrl = statusUrl.getSeleniumStatusUrl(seleniumArgs);
  const options = {
    responseType: 'json',
    timeout: 10000,
    retry: 0,
  };

  let attempts = 20;
  const startTime = Date.now();
  while (attempts > 0 && Date.now() - startTime < 60000) {
    await sleep(500);
    attempts--;

    try {
      // server has one minute to start
      await got(seleniumStatusUrl, options);
      return null;
    } catch (err) {
      // suppress first 3 messages
      if (attempts < 7) {
        console.error('Failed to connect to selenium.', 'Attempts left:', attempts, '\n', err.message);
      }
    }
  }

  return new Error('Unable to connect to selenium');
}

module.exports = checkStarted;

const got = require('got');
const { sleep } = require('./delay');

async function checkStarted(selenium, seleniumStatusUrl) {
  const cpState = {
    stderr: '',
    stdout: '',
  };
  selenium.once('exit', errorIfNeverStarted.bind(cpState));
  if (selenium.stderr && selenium.stdout) {
    selenium.stdout.on('data', (d) => (cpState.stdout += d.toString()));
    selenium.stderr.on('data', (d) => (cpState.stderr += d.toString()));
  }

  const DEFAULT_SELENUIM_CHECK_STARTED_TIMEOUT = 60000; // 1minute
  const DEFAULT_SELENUIM_CHECK_STARTED_PAUSE = 500; // 0.5 second
  const GOT_STARTUP_TIMEOUT = 10000; // 10 secs

  const serverStartupTimeoutMS =
    parseInt(process.env.SELENUIM_CHECK_STARTED_TIMEOUT, 10) || DEFAULT_SELENUIM_CHECK_STARTED_TIMEOUT;

  const serverStartupPauseMs =
    parseInt(process.env.SELENUIM_CHECK_STARTED_PAUSE, 10) || DEFAULT_SELENUIM_CHECK_STARTED_PAUSE;

  const gotOptions = {
    responseType: 'json',
    timeout: {
      request: GOT_STARTUP_TIMEOUT,
    },
    retry: {
      limit: 0,
    },
  };

  let attempts = serverStartupTimeoutMS / serverStartupPauseMs;
  const startTime = Date.now();
  while (attempts > 0 && Date.now() - startTime < serverStartupTimeoutMS) {
    await sleep(serverStartupPauseMs);
    attempts--;

    if (cpState.exited) {
      throw new Error(
        `Selenium exited before it could start with code ${cpState.code}\nStdout: ${cpState.stdout}\nStderr: ${cpState.stderr}`
      );
    }

    try {
      // server has one minute to start
      await got(seleniumStatusUrl, gotOptions);
      selenium.removeListener('exit', errorIfNeverStarted);
      return null;
    } catch (err) {
      // suppress some messages
      if (attempts % 5 === 0) {
        console.error('Failed to connect to selenium.', 'Attempts left:', attempts, '\n', err.message);
      }
    }
  }

  selenium.kill('SIGINT');
  throw new Error('Unable to connect to selenium');
}

function errorIfNeverStarted(code) {
  this.code = code;
  this.exited = true;
}

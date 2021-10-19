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

  const options = {
    responseType: 'json',
    timeout: 10000,
    retry: 0,
  };

  let attempts = 29;
  const startTime = Date.now();
  while (attempts > 0 && Date.now() - startTime < 30000) {
    await sleep(500);
    attempts--;

    if (cpState.exited) {
      throw new Error(
        `Selenium exited before it could start with code ${cpState.code}\nStdout: ${cpState.stdout}\nStderr: ${cpState.stderr}`
      );
    }

    try {
      // server has one minute to start
      await got(seleniumStatusUrl, options);
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

const ChildProcess = require('child_process');
const delay = require('./delay');

async function startDriver(pathToChromeDriver, args) {
  const options = {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  };
  let chromeDriverProcess;

  if (process.platform === 'win32' && !pathToChromeDriver.endsWith('.exe')) {
    chromeDriverProcess = ChildProcess.spawn('powershell', [
      `Start-Process -FilePath "${pathToChromeDriver}"`,
      '-Wait',
      '-NoNewWindow',
    ]);
  } else {
    chromeDriverProcess = ChildProcess.spawn(pathToChromeDriver, args, options);
  }
  await delay.sleep(3000);

  chromeDriverProcess.on('close', (code) => {
    if (code !== null && code !== 0 && code !== 1) {
      throw new Error(`Chromedriver exited with error code: ${code}`);
    }
  });

  chromeDriverProcess.on('error', (error) => {
    throw new Error(error);
  });

  const killChromeDriver = () => {
    try {
      chromeDriverProcess.kill();
    } catch (_) {
      // eslint-disable-next-line no-empty
    }
  };
  process.on('exit', killChromeDriver);
  process.on('SIGTERM', killChromeDriver);

  return chromeDriverProcess;
}

module.exports = {
  startDriver,
};

const ChildProcess = require('child_process');
const delay = require('./delay');

async function startDriver(pathToDriver, args) {
  /** @type {import('child_process').SpawnOptions} */
  const options = {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  };
  let driverProcess;

  if (process.platform === 'win32' && !pathToDriver.endsWith('.exe')) {
    driverProcess = ChildProcess.spawn('powershell', [
      `Start-Process -FilePath "${pathToDriver}"`,
      '-Wait',
      '-NoNewWindow',
    ]);
  } else {
    driverProcess = ChildProcess.spawn(pathToDriver, args, options);
  }
  await delay.sleep(3000);

  driverProcess.on('close', (code) => {
    if (code !== null && code !== 0 && code !== 1) {
      throw new Error(`Chromedriver exited with error code: ${code}`);
    }
  });

  driverProcess.on('error', (error) => {
    throw new Error(error);
  });

  const killChromeDriver = () => {
    try {
      driverProcess.kill();
    } catch (_) {
      // eslint-disable-next-line no-empty
    }
  };
  process.on('exit', killChromeDriver);
  process.on('SIGTERM', killChromeDriver);

  return driverProcess;
}

module.exports = {
  startDriver,
};

const fkill = require('fkill');
const findProcess = require('find-process');
const { command } = require('execa');

function getConfigProcessesName(drivers) {
  const driversName = Object.keys(drivers);
  const processesName = [];

  if (driversName && driversName.length) {
    for (const driverName of driversName) {
      if (driverName === 'chrome') {
        processesName.push('chromedriver');
      } else if (driverName === 'firefox') {
        processesName.push('geckodriver');
      } else if (driverName === 'chromiumedge') {
        processesName.push('msedgedriver');
      } else if (driverName === 'ie') {
        processesName.push('IEDriverServer');
      } else if (driverName === 'safari') {
        processesName.push('safaridriver');
      }
    }
  }
  return processesName;
}

async function processKiller(drivers, portValue) {
  if (portValue) {
    if (!Number.isNaN(Number(`${portValue}`.startsWith(':') ? `${portValue}`.substring(1) : `${portValue}`))) {
      const portCast = `${portValue}`.startsWith(':') ? portValue : `:${portValue}`;

      await killProcessByFkill([portCast]);
      await killProcessByCmd([`${portValue}`.startsWith(':') ? `${portValue}`.substring(1) : portValue], 'port');
    }
  }
  if (drivers && typeof drivers === 'object' && Object.keys(drivers).length) {
    await killProcess(getConfigProcessesName(drivers), 'name');
  }
}

async function killProcess(processesNameArr, type) {
  await killProcessByFkill(processesNameArr);
  await killProcessByCmd(processesNameArr, type);
}

async function killProcessByCmd(processes, type) {
  if (processes && processes.length) {
    for (const processSingle of processes) {
      const results = await findProcess(type, processSingle, true);

      if (results && results.length) {
        for (const result of results) {
          try {
            if (process.platform === 'win32' && !result.name.includes('node')) {
              await command(`taskkill /F /IM ${result.name} /T`);

              console.log(`Killed process: "${processSingle}" system name is "${result.name}"`);
            } else if (!process.name.includes('node')) {
              await command(`pkill -f ${result.name}`);

              console.log(`Killed process: "${processSingle}" system name is "${result.name}"`);
            }
          } catch (_) {
            // eslint-disable-next-line no-empty
          }
        }
      }
    }
  }
}

async function killProcessByFkill(processes) {
  for (const process of processes) {
    try {
      await fkill([process], { force: true, tree: true, ignoreCase: true });

      console.log(`Killed process: "${process}"`);
    } catch (_) {
      // eslint-disable-next-line no-empty
    }
  }
}

module.exports = {
  processKiller,
};

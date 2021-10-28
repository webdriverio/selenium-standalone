module.exports = start;

const debug = require('debug')('selenium-standalone:start');
const mapValues = require('lodash.mapvalues');
const merge = require('lodash.merge');
const spawn = require('child_process').spawn;
const which = require('which');
const isPortReachable = require('is-port-reachable');

const statusUrl = require('./get-selenium-status-url.js');
const checkPathsExistence = require('./check-paths-existence');
const checkStarted = require('./check-started');
const computeFsPaths = require('./compute-fs-paths');
const defaultConfig = require('./default-config')();
const { checkArgs } = require('./check-args');
const { isSelenium4 } = require('./isSelenium4');
const noop = require('./noop');

async function start(_opts) {
  const opts = checkArgs('Start API', _opts);

  if (!opts.javaArgs) {
    opts.javaArgs = [];
  }

  if (!opts.seleniumArgs) {
    opts.seleniumArgs = [];
  }

  if (!opts.version) {
    opts.version = defaultConfig.version;
  }

  if (
    isSelenium4(opts.version) &&
    !hasParam(opts.seleniumArgs, 'hub') &&
    !hasParam(opts.seleniumArgs, 'node') &&
    !hasParam(opts.seleniumArgs, 'standalone') &&
    !hasParam(opts.seleniumArgs, 'distributor')
  ) {
    opts.seleniumArgs.unshift('standalone');
  }

  if (opts.drivers) {
    // Merge in missing driver options for those specified
    opts.drivers = mapValues(opts.drivers, (config, name) => {
      return merge({}, defaultConfig.drivers[name], config);
    });
  } else {
    opts.drivers = defaultConfig.drivers;
  }

  if (opts.singleDriverStart) {
    const singleDriver = opts.drivers[opts.singleDriverStart];
    if (singleDriver) {
      opts.drivers = {};
      opts.drivers[opts.singleDriverStart] = singleDriver;
    }
  }

  const fsPaths = computeFsPaths({
    seleniumVersion: opts.version,
    drivers: opts.drivers,
    basePath: opts.basePath,
  });

  // programmatic use, did not give javaPath
  if (!opts.javaPath) {
    opts.javaPath = which.sync('java');
  }

  const args = [];

  /* Command to run selenium is build in the following order:
      0) Java executable
      1) System level properties
      2) Jar binary
      3) Selenium specific arguments

     Example:
       java -Dwebdriver.chrome.driver=.selenium/chromedriver/latest-x64/chromedriver \
          -jar ./.selenium/selenium-server/4.0.0/selenium-server.jar \
          hub
   */
  if (fsPaths.chrome) {
    args.push('-Dwebdriver.chrome.driver=' + fsPaths.chrome.installPath);
  }

  if (process.platform === 'win32' && fsPaths.ie) {
    args.push('-Dwebdriver.ie.driver=' + fsPaths.ie.installPath);
  } else {
    delete fsPaths.ie;
  }

  if (process.platform === 'win32' && fsPaths.edge) {
    args.push('-Dwebdriver.edge.driver=' + fsPaths.edge.installPath);
  } else {
    delete fsPaths.edge;
  }

  if (fsPaths.firefox) {
    args.push('-Dwebdriver.gecko.driver=' + fsPaths.firefox.installPath);
  }

  if (fsPaths.chromiumedge) {
    args.push('-Dwebdriver.edge.driver=' + fsPaths.chromiumedge.installPath);
  } else {
    delete fsPaths.chromiumedge;
  }

  args.push(...opts.javaArgs, '-jar', fsPaths.selenium.installPath, ...opts.seleniumArgs);

  await checkPathsExistence(Object.keys(fsPaths).map((name) => fsPaths[name].installPath));

  const seleniumStatusUrl = statusUrl.getSeleniumStatusUrl(args, opts);
  if (await isPortReachable(seleniumStatusUrl.port, { timeout: 100 })) {
    throw new Error(`Port ${seleniumStatusUrl.port} is already in use.`);
  }

  debug('Spawning Selenium Server process', opts.javaPath, args);
  const selenium = spawn(opts.javaPath, args, opts.spawnOptions);
  await checkStarted(selenium, seleniumStatusUrl.toString());

  if (selenium.stdout) {
    selenium.stdout.on('data', noop);
  }

  if (selenium.stderr) {
    selenium.stderr.on('data', noop);
  }

  return selenium;
}

function hasParam(list, param) {
  return list.find((p) => p === param);
}

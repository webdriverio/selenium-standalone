module.exports = start;

const debug = require('debug')('selenium-standalone:start');
const mapValues = require('lodash.mapvalues');
const merge = require('lodash.merge');
const spawn = require('child_process').spawn;
const which = require('which');

const checkPathsExistence = require('./check-paths-existence');
const checkStarted = require('./check-started');
const computeFsPaths = require('./compute-fs-paths');
const defaultConfig = require('./default-config')();
const noop = require('./noop');
const { checkArgs } = require('./check-args');

function start(_opts, _cb) {
  const { opts, cb } = checkArgs('Start API', _opts, _cb);

  if (!opts.javaArgs) {
    opts.javaArgs = [];
  }

  if (!opts.seleniumArgs) {
    opts.seleniumArgs = [];
  }

  if (!opts.version) {
    opts.version = defaultConfig.version;
  }

  if (!opts.spawnCb) {
    opts.spawnCb = noop;
  }

  if (opts.drivers) {
    // Merge in missing driver options for those specified
    opts.drivers = mapValues(opts.drivers, (config, name) => {
      return merge({}, defaultConfig.drivers[name], config);
    });
  } else {
    opts.drivers = defaultConfig.drivers;
  }

  const fsPaths = computeFsPaths({
    seleniumVersion: opts.version,
    drivers: opts.drivers,
    basePath: opts.basePath,
  });

  if (typeof cb !== 'function') {
    throw new Error('You must provide a callback when starting selenium');
  }

  // programmatic use, did not give javaPath
  if (!opts.javaPath) {
    opts.javaPath = which.sync('java');
  }

  /* Command to run selenium is build in the following order:
      0) Java executable
      1) System level properties
      2) Jar binary
      3) Selenium specific arguments

     Example:
       java -Dwebdriver.chrome.driver=./.selenium/chromedriver/2.27-x64-chromedriver \
          -jar ./.selenium/selenium-server/3.0.1-server.jar \
          -role hub
   */
  let args = [];

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

  if (process.platform !== 'linux' && fsPaths.chromiumedge) {
    args.push('-Dwebdriver.edge.driver=' + fsPaths.chromiumedge.installPath);
  } else {
    delete fsPaths.chromiumedge;
  }

  args = args.concat(opts.javaArgs);

  args = args.concat(['-jar', fsPaths.selenium.installPath]);

  args = args.concat(opts.seleniumArgs);

  checkPathsExistence(getInstallPaths(fsPaths), (errExist) => {
    if (errExist) {
      cb(errExist);
      return;
    }

    let neverStarted = false;
    debug('Spawning Selenium Server process', opts.javaPath, args);
    const selenium = spawn(opts.javaPath, args, opts.spawnOptions);

    opts.spawnCb(selenium);

    selenium.on('exit', errorIfNeverStarted);

    checkStarted(args).then(function started(errStarted) {
      process.nextTick(() => {
        // Add empty handler to stdout and stderr so the buffers can be flushed
        // otherwise the process would eat up memory for nothing and crash
        // we add it here so that users can register their own listeners
        if (selenium.stdout && selenium.stderr) {
          if (selenium.stdout.listeners('data').length === 0) {
            selenium.stdout.on('data', noop);
          }
          if (selenium.stderr.listeners('data').length === 0) {
            selenium.stderr.on('data', noop);
          }
        }
      });

      selenium.removeListener('exit', errorIfNeverStarted);

      if (errStarted) {
        cb(errStarted, selenium);
        return;
      }

      if (!neverStarted) {
        cb(null, selenium);
      } // else ignore, callback has already been called in errorIfNeverStarted()
    });

    function errorIfNeverStarted(code) {
      neverStarted = true;

      let errorMsg;
      if (code === 1) {
        errorMsg = 'Selenium server did not start.\n';
      } else {
        errorMsg = 'Selenium exited before it could start\n';
      }
      errorMsg += 'Another Selenium process may already be running or your java version may be out of date.\n';

      // TODO: Is there a way to get this info from the api?
      // 3.x requires Java 8+, 2.47.0+ requires Java 7 - 7 is also end-of-life apparently ?
      errorMsg +=
        'Be sure to check the official Selenium release notes for minimum required java version: https://raw.githubusercontent.com/SeleniumHQ/selenium/master/java/CHANGELOG\n';

      cb(new Error(errorMsg), selenium);
    }
  });
}

function getInstallPaths(fsPaths) {
  return Object.keys(fsPaths).map((name) => {
    return fsPaths[name].installPath;
  });
}

const fs = require('fs');
const { isSelenium4 } = require('./isSelenium4');

/**
 * @readonly
 * @enum {number}
 */
const PROCESS_TYPES = {
  STANDALONE: 0,
  GRID_HUB: 1,
  GRID_NODE: 2,
  DISTRIBUTOR_NODE: 3,
};

/**
 * @param {string | undefined} role
 * @returns {PROCESS_TYPES}
 */
const parseRole = (role) => {
  if (!role || role === 'standalone') return PROCESS_TYPES.STANDALONE;
  if (role === 'hub') return PROCESS_TYPES.GRID_HUB;
  if (role === 'node') return PROCESS_TYPES.GRID_NODE;
  if (role === 'distributor') return PROCESS_TYPES.DISTRIBUTOR_NODE;
};

/**
 * @param {PROCESS_TYPES} processType
 */
const getDefaultPort = (processType) => {
  switch (processType) {
    case PROCESS_TYPES.STANDALONE:
    case PROCESS_TYPES.GRID_HUB:
      return 4444;
    case PROCESS_TYPES.GRID_NODE:
      return 5555;
  }
};

/**
 * @param {string[]} seleniumArgs
 * @returns {PROCESS_TYPES}
 */
const getRunningProcessType = (seleniumArgs) => {
  const roleArg = Math.max(
    seleniumArgs.indexOf('hub'),
    seleniumArgs.indexOf('node'),
    seleniumArgs.indexOf('standalone'),
    seleniumArgs.indexOf('distributor')
  );
  const role = roleArg !== -1 ? seleniumArgs[roleArg] : undefined;

  return parseRole(role);
};

/**
 * @param {string[]} seleniumArgs - Command line arguments
 * @param {{ version?: string }} opts
 * @returns {URL}
 *
 * @throws {Error} The args use the `distributor` process type.
 */
const getSeleniumStatusUrl = (seleniumArgs, opts) => {
  const nodeConfigArg = seleniumArgs.indexOf('-nodeConfig');

  // The CLI args prefix is "-" for Selenium v3 and "--" for v4.
  let argsPrefix = '-';
  if (isSelenium4(opts.version)) {
    argsPrefix = '--';
  }

  let host = 'localhost';
  let port;
  let config;
  let processType = getRunningProcessType(seleniumArgs);

  // If node config path is pass via -nodeConfig, we have to take settings from there,
  // and override them with possible command line options, as later ones have higher priority
  if (nodeConfigArg !== -1) {
    // Load node configuration and parse it
    config = JSON.parse(fs.readFileSync(seleniumArgs[nodeConfigArg + 1], 'utf8'));
    if (config.host) {
      host = config.host;
    }
    if (config.port) {
      port = config.port;
    }

    // If processType is defined, then it was specified via command line options,
    // we ignore the value defined in the config file, otherwise we take it from the file
    if (!processType && config.role) {
      processType = parseRole(config.role);
    }
  }

  // Override the port and host if they were specified
  const portArg = seleniumArgs.indexOf(`${argsPrefix}port`);
  if (portArg !== -1) {
    port = seleniumArgs[portArg + 1];
  }

  const hostArg = seleniumArgs.indexOf(`${argsPrefix}host`);
  if (hostArg !== -1) {
    host = seleniumArgs[hostArg + 1];
  }

  const statusURI = new URL('http://' + host);
  const nodeStatusAPIPath = isSelenium4(opts.version) ? '/status' : '/wd/hub/status';
  const hubStatusAPIPath = '/grid/api/hub';

  switch (processType) {
    case PROCESS_TYPES.STANDALONE:
      statusURI.pathname = nodeStatusAPIPath;
      break;
    case PROCESS_TYPES.GRID_HUB:
      statusURI.pathname = hubStatusAPIPath;
      break;
    case PROCESS_TYPES.GRID_NODE:
      statusURI.pathname = nodeStatusAPIPath;
      break;
    default:
      throw new Error('ERROR: Trying to run selenium in an unknown way.');
  }

  // Running non-default port if it was specified or default one if it was not
  statusURI.port = port || getDefaultPort(processType);
  return statusURI;
};

module.exports = {
  getSeleniumStatusUrl,
  getRunningProcessType,
  PROCESS_TYPES,
};

const fs = require('fs');

const PROCESS_TYPES = {
  STANDALONE: 0,
  GRID_HUB: 1,
  GRID_NODE: 2,
};
exports.PROCESS_TYPES = PROCESS_TYPES;

function parseRole(role) {
  if (!role) return PROCESS_TYPES.STANDALONE;
  if (role === 'hub') return PROCESS_TYPES.GRID_HUB;
  if (role === 'node') return PROCESS_TYPES.GRID_NODE;
  return undefined;
}

function getDefaultPort(processType) {
  switch (processType) {
    case PROCESS_TYPES.STANDALONE:
    case PROCESS_TYPES.GRID_HUB:
      return 4444;
    case PROCESS_TYPES.GRID_NODE:
      return 5555;
  }
}

exports.getRunningProcessType = function (seleniumArgs) {
  const roleArg = seleniumArgs.indexOf('-role');
  const role = roleArg !== -1 ? seleniumArgs[roleArg + 1] : undefined;

  return parseRole(role);
};

exports.getSeleniumStatusUrl = function (seleniumArgs) {
  const nodeConfigArg = seleniumArgs.indexOf('-nodeConfig');
  const portArg = seleniumArgs.indexOf('-port');
  const hostArg = seleniumArgs.indexOf('-host');
  let host = 'localhost';
  let port;
  let config;
  let processType = this.getRunningProcessType(seleniumArgs);

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

  // Overrode port and host if they were specified
  if (portArg !== -1) {
    port = seleniumArgs[portArg + 1];
  }
  if (hostArg !== -1) {
    host = seleniumArgs[hostArg + 1];
  }

  const statusURI = new URL('http://' + host);
  const nodeStatusAPIPath = '/wd/hub/status';
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
  return statusURI.toString();
};

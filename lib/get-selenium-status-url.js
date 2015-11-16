var URI = require('urijs');
var PROCESS_TYPES = exports.PROCESS_TYPES = {
  STANDALONE: 0,
  GRID_HUB: 1,
  GRID_NODE: 2
};

exports.getRunningProcessType = function(seleniumArgs) {
  var roleArg = seleniumArgs.indexOf('-role');
  var role = (roleArg !== -1) ? seleniumArgs[roleArg + 1] : undefined;

  if (roleArg === -1) return PROCESS_TYPES.STANDALONE;
  else if (role === 'hub') return PROCESS_TYPES.GRID_HUB;
  else if (role === 'node') return PROCESS_TYPES.GRID_NODE;
  else return undefined;
}

exports.getSeleniumStatusUrl = function(seleniumArgs) {
  var processType = this.getRunningProcessType(seleniumArgs);
  var portArg = seleniumArgs.indexOf('-port');
  var port = (portArg !== -1) ? seleniumArgs[portArg + 1] : undefined;

  var statusURI = new URI('http://localhost');
  var nodeStatusAPIPath = '/wd/hub/status';
  var hubStatusAPIPath = '/grid/api/hub';

  switch (processType) {
    case PROCESS_TYPES.STANDALONE:
      statusURI.port(4444);
      statusURI.path(nodeStatusAPIPath);
      break;
    case PROCESS_TYPES.GRID_HUB:
      statusURI.port(4444);
      statusURI.path(hubStatusAPIPath);
      break;
    case PROCESS_TYPES.GRID_NODE:
      statusURI.port(5555);
      statusURI.path(nodeStatusAPIPath);
      break;
    default:
      throw 'ERROR: Trying to run selenium in an unknown way.';
  }

  // Running with a non-default port
  if (portArg !== -1) {
    statusURI.port(seleniumArgs[portArg + 1]);
  }

  return statusURI.toString();
}

exports.getRemoteSeleniumHubStatusUrl = function(seleniumArgs) {
  var processType = this.getRunningProcessType(seleniumArgs);
  var hubArg = seleniumArgs.indexOf('-hub');
  var statusURI = (hubArg !== -1) ? new URI(seleniumArgs[hubArg + 1]) : new URI('http://localhost:4444');
  statusURI.path('/grid/api/hub');

  switch (processType) {
    case PROCESS_TYPES.STANDALONE:
    case PROCESS_TYPES.GRID_HUB:
      // Standalone servers and grid hubs ignore the `-hub` argument, so the
      // status URLs will be the same the status URLs for itself.
      return this.getSeleniumStatusUrl(seleniumArgs);
    case PROCESS_TYPES.GRID_NODE:
      // Grid nodes will either connect to the default localhost:4444 hub, or the
      // one specified by the `-hub` argument.
      return statusURI.toString();
    default:
      throw 'ERROR: Trying to run selenium in an unknown way.';
  }
}

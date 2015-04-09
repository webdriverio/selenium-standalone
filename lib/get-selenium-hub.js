module.exports = getSeleniumHub;

var URI = require('URIjs');

function getSeleniumHub(seleniumArgs) {
  var port = 4444;
  var hostname = 'localhost';
  var portArg = seleniumArgs.indexOf('-port');
  var hubArg = seleniumArgs.indexOf('-hub');

  if (hubArg !== -1) {
    hubURI = new URI(seleniumArgs[hubArg + 1]);
    hostname = hubURI.hostname() || hostname;
    port = hubURI.port() || port;
  }

  if (portArg !== -1) {
    port = seleniumArgs[portArg + 1];
  }

  return 'http://' + hostname + ':' + port + '/wd/hub/status';
}

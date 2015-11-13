module.exports = getSeleniumStatusUrl;

var URI = require('urijs');

function getSeleniumStatusUrl(seleniumArgs) {
  var port = 4444;
  var hostname = 'localhost';
  var portArg = seleniumArgs.indexOf('-port');
  var hubArg = seleniumArgs.indexOf('-hub');
  var roleArg = seleniumArgs.indexOf('-role');

  var nodeStatusAPIPath = '/wd/hub/status';
  var hubStatusAPIPath = '/grid/api/hub';

  if (hubArg !== -1) {
    hubURI = new URI(seleniumArgs[hubArg + 1]);
    hostname = hubURI.hostname() || hostname;
    port = hubURI.port() || port;
  }

  if (roleArg !== -1) {
    switch(seleniumArgs[roleArg + 1]){
      case 'node':
        if(hubArg === -1){
          port = portArg !== -1 ? seleniumArgs[portArg + 1] : 5555;
        }
        return 'http://' + hostname + ':' + port + hubStatusAPIPath;
      case 'hub':
        port = portArg !== -1 ? seleniumArgs[portArg + 1] : 4444;
        return 'http://localhost:' + port + hubStatusAPIPath;
    }
  }

  if (portArg !== -1) {
    port = seleniumArgs[portArg + 1];
  }

  return 'http://' + hostname + ':' + port + nodeStatusAPIPath;
}

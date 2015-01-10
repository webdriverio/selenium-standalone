module.exports = computePaths;

var path = require('path');

var basePath = path.join(__dirname, '..', '.selenium');

function computePaths(opts) {
  return {
    chrome: path.join(basePath, 'chromedriver', opts.drivers.chrome.version + '-' + opts.drivers.chrome.arch + '-chromedriver'),
    ie: path.join(basePath, 'iedriver', opts.drivers.ie.version + '-' + opts.drivers.ie.arch + '-IEDriverServer.exe'),
    selenium: path.join(basePath, 'selenium-server', opts.version + '-server.jar')
  };
}

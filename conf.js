var path = require('path');

// see http://selenium-release.storage.googleapis.com/index.html for latest
var version = '2.44.0';

module.exports = {
  selenium: {
    path: path.join(__dirname, '.selenium', version, 'server.jar'),
    v: version
  },
  chromeDr: {
    path: path.join(__dirname, '.selenium', version, 'chromedriver'),
    // see http://chromedriver.storage.googleapis.com/index.html
    v: '2.12'
  },
  ieDr: {
    path: path.join(__dirname, '.selenium', version, 'IEDriverServer.exe'),
    // see http://selenium-release.storage.googleapis.com/index.html
    v: '2.44.0',
    arch: process.env.IEDRIVER_ARCH !== undefined ? process.env.IEDRIVER_ARCH : process.arch
  }
};

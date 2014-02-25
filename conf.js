var path = require('path');

// see http://selenium-release.storage.googleapis.com/index.html for latest
var version = '2.40.0';

module.exports = {
  selenium: {
    path: path.join(__dirname, '.selenium', version, 'server.jar'),
    v: version
  },
  chromeDr: {
    path: path.join(__dirname, '.selenium', version, 'chromedriver'),
    // see http://chromedriver.storage.googleapis.com/index.html
    v: '2.9'
  }
};
var path = require('path');

// see https://code.google.com/p/selenium/downloads/list for latest
var version = '2.37.0';

module.exports = {
  selenium: {
    path: path.join(__dirname, '.selenium', version, 'server.jar'),
    v: version
  },
  chromeDr: {
    path: path.join(__dirname, '.selenium', version, 'chromedriver'),
    // see http://chromedriver.storage.googleapis.com/index.html
    v: '2.7'
  }
};
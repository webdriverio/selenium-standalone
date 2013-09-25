var path = require('path');

// see https://code.google.com/p/selenium/downloads/list for latest
var version = '2.35.0';

module.exports = {
  selenium: {
    path: path.join(__dirname, '.selenium', version, 'server.jar'),
    v: version
  },
  chromeDr: {
    path: path.join(__dirname, '.selenium', version, 'chromedriver'),
    // see https://code.google.com/p/chromedriver/downloads/list
    v: '2.3'
  }
};
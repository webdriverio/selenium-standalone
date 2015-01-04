var path = require('path');

// see http://selenium-release.storage.googleapis.com/index.html for latest
var version = process.env.SELENIUM_VERSION || '2.44.0';
var argvStr = process.argv.slice(2).join(' ');

// http://www.seleniumhq.org/docs/07_selenium_grid.jsp
// if you want to run selenium on a different port
// matches assuming selenium standalone argument style e.g. java -jar selenium-server-standalone.jar -port 2222
var port = argvStr.match(/-port ([\d]+)/i);
port = port ? port[1] : 4444;

module.exports = {
  selenium: {
    path: path.join(__dirname, '.selenium', version, 'server.jar'),
    v: version,
    hub: 'http://localhost:' + port + '/wd/hub/status'
  },
  chromeDr: {
    path: path.join(__dirname, '.selenium', version, 'chromedriver'),
    // see http://chromedriver.storage.googleapis.com/index.html
    v: process.env.CHROMEDRIVER_VERSION || '2.13'
  },
  ieDr: {
    path: path.join(__dirname, '.selenium', version, 'IEDriverServer.exe'),
    // see http://selenium-release.storage.googleapis.com/index.html
    v: process.env.IEDRIVER_VERSION || '2.44.0',
    arch: process.env.IEDRIVER_ARCH !== undefined ? process.env.IEDRIVER_ARCH : process.arch
  }
};

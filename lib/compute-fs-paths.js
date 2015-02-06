module.exports = computeFsPaths;

var path = require('path');

var basePath = path.join(__dirname, '..', '.selenium');

function computeFsPaths(opts) {
  var fsPaths = {
    chrome: {
      installPath: path.join(basePath, 'chromedriver', opts.drivers.chrome.version + '-' + opts.drivers.chrome.arch + '-chromedriver')
    },
    ie: {
      installPath: path.join(basePath, 'iedriver', opts.drivers.ie.version + '-' + opts.drivers.ie.arch + '-IEDriverServer.exe')
    },
    selenium: {
      installPath: path.join(basePath, 'selenium-server', opts.seleniumVersion + '-server.jar')
    }
  };

  fsPaths = Object.keys(fsPaths).reduce(function computeDownloadPath(newFsPaths, name) {
    var downloadPath;

    if (name === 'selenium') {
      downloadPath = newFsPaths[name].installPath;
    } else {
      downloadPath = newFsPaths[name].installPath + '.zip';
    }

    newFsPaths[name].downloadPath = downloadPath;
    return newFsPaths;
  }, fsPaths);

  return fsPaths;
}

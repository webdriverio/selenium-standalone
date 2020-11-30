module.exports = computeFsPaths;

const path = require('path');

const basePath = path.join(__dirname, '..', '.selenium');

function computeFsPaths(options) {
  let fsPaths = {};
  const opts = Object.assign({}, options);
  opts.basePath = opts.basePath || basePath;
  if (opts.drivers.chrome) {
    fsPaths.chrome = {
      installPath: path.join(
        opts.basePath,
        'chromedriver',
        opts.drivers.chrome.version + '-' + opts.drivers.chrome.arch + '-chromedriver'
      ),
      requireChmod: true,
    };
  }

  if (opts.drivers.ie) {
    fsPaths.ie = {
      installPath: path.join(
        opts.basePath,
        'iedriver',
        opts.drivers.ie.version + '-' + opts.drivers.ie.arch + '-IEDriverServer.exe'
      ),
    };
  }

  if (opts.drivers.edge) {
    fsPaths.edge = {
      installPath: path.join(opts.basePath, 'edgedriver', opts.drivers.edge.version + '-MicrosoftEdgeDriver.exe'),
    };
  }

  if (opts.drivers.firefox) {
    fsPaths.firefox = {
      installPath: path.join(
        opts.basePath,
        'geckodriver',
        opts.drivers.firefox.version + '-' + opts.drivers.firefox.arch + '-geckodriver'
      ),
      requireChmod: true,
    };
  }

  if (opts.drivers.chromiumedge) {
    fsPaths.chromiumedge = {
      installPath: path.join(
        opts.basePath,
        'chromiumedgedriver',
        opts.drivers.chromiumedge.version + '-' + opts.drivers.chromiumedge.arch + '-msedgedriver'
      ),
      requireChmod: true,
    };
  }

  fsPaths.selenium = {
    installPath: path.join(opts.basePath, 'selenium-server', opts.seleniumVersion + '-server.jar'),
  };

  fsPaths = Object.keys(fsPaths).reduce(function computeDownloadPath(acc, name) {
    let downloadPath;

    if (name === 'selenium' || name === 'edge') {
      downloadPath = acc[name].installPath;
    } else if (name === 'firefox' && process.platform !== 'win32') {
      downloadPath = acc[name].installPath + '.gz';
    } else {
      downloadPath = acc[name].installPath + '.zip';
    }

    acc[name].downloadPath = downloadPath;
    return acc;
  }, fsPaths);

  return fsPaths;
}

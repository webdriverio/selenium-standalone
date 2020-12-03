module.exports = () => {
  const config = {
    baseURL: 'https://selenium-release.storage.googleapis.com',
    version: '4.0.0-alpha-3',
    drivers: {
      chrome: {
        version: 'latest',
        fallbackVersion: '87.0.4280.20',
        arch: process.arch,
        baseURL: 'https://chromedriver.storage.googleapis.com',
      },
      ie: {
        version: '3.150.1',
        arch: process.arch,
        baseURL: 'https://selenium-release.storage.googleapis.com',
      },
      firefox: {
        version: 'latest',
        fallbackVersion: '0.28.0',
        arch: process.arch,
        baseURL: 'https://github.com/mozilla/geckodriver/releases/download',
      },
      edge: {
        version: '17134',
      },
    },
  };

  // disabled chromiumedge because https://msedgedriver.azureedge.net doesn't support caching
  if (!process.env.SS_TESTING) {
    config.drivers.chromiumedge = {
      version: 'latest',
      fallbackVersion: '87.0.637.0',
      arch: process.arch,
      baseURL: 'https://msedgedriver.azureedge.net',
    };
  }

  return config;
};

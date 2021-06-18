module.exports = () => {
  const config = {
    baseURL: 'https://selenium-release.storage.googleapis.com',
    version: '3.141.59',
    drivers: {
      chrome: {
        version: 'latest',
        fallbackVersion: '91.0.4472.101',
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
        fallbackVersion: '0.29.1',
        arch: process.arch,
        baseURL: 'https://github.com/mozilla/geckodriver/releases/download',
      },
      edge: {
        version: '17134',
      },
      chromiumedge: {
        version: 'latest',
        fallbackVersion: '91.0.864.53',
        arch: process.arch,
        baseURL: 'https://msedgedriver.azureedge.net',
      },
    },
  };

  return config;
};

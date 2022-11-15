module.exports = () => {
  const config = {
    baseURL: 'https://github.com/SeleniumHQ/selenium/releases/download',
    version: process.env.SELENIUM_VERSION || '4.4.0',
    drivers: {
      chrome: {
        version: 'latest',
        fallbackVersion: '94.0.4606.61',
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
        fallbackVersion: '0.30.0',
        arch: process.arch,
        baseURL: 'https://github.com/mozilla/geckodriver/releases/download',
      },
      edge: {
        version: '17134',
      },
      chromiumedge: {
        version: 'latest',
        fallbackVersion: '96.0.1054.34',
        arch: process.arch,
        baseURL: 'https://msedgedriver.azureedge.net',
      },
    },
  };

  return config;
};

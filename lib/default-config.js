module.exports = () => {
  return {
    baseURL: 'https://github.com/SeleniumHQ/selenium/releases/download',
    version: process.env.SELENIUM_VERSION || '4.9.0',
    drivers: {
      chrome: {
        version: 'latest',
        channel: 'stable',
        arch: process.arch,
        onlyDriverArgs: [],
        baseURL: 'https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing',
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
        onlyDriverArgs: [],
        baseURL: 'https://github.com/mozilla/geckodriver/releases/download',
      },
      edge: {
        version: '17134',
      },
      chromiumedge: {
        version: 'latest',
        fallbackVersion: '117.0.2045.55',
        arch: process.arch,
        onlyDriverArgs: [],
        baseURL: 'https://msedgedriver.azureedge.net',
      },
    },
  };
};

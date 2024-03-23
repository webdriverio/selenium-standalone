module.exports = () => {
  return {
    baseURL: 'https://github.com/SeleniumHQ/selenium/releases/download',
    version: process.env.SELENIUM_VERSION || '4.10.0',

    /** @type {import("./start").Drivers} */
    drivers: {
      chrome: {
        version: 'latest',
        channel: 'stable',
        arch: process.arch,
        onlyDriverArgs: [],
        baseURL: 'https://storage.googleapis.com/chrome-for-testing-public',
      },
      firefox: {
        version: 'latest',
        fallbackVersion: '0.30.0',
        arch: process.arch,
        onlyDriverArgs: [],
        baseURL: 'https://github.com/mozilla/geckodriver/releases/download',
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

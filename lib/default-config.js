module.exports = () => {
  const config = {
    baseURL: 'https://github.com/SeleniumHQ/selenium/releases/download',
    version: process.env.SELENIUM_VERSION || '4.4.0',
    drivers: {
      chrome: {
        version: '86',
        channel: 'stable',
        arch: process.arch,
        baseURL: 'https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing',
      },
    },
  };

  return config;
};

module.exports = {
  baseURL: 'https://selenium-release.storage.googleapis.com',
  version: '3.5.3',
  drivers: {
    chrome: {
      version: '2.32',
      arch: process.arch,
      baseURL: 'https://chromedriver.storage.googleapis.com'
    },
    ie: {
      version: '3.5.1',
      arch: process.arch,
      baseURL: 'https://selenium-release.storage.googleapis.com'
    },
    firefox: {
      version: '0.18.0',
      arch: process.arch,
      baseURL: 'https://github.com/mozilla/geckodriver/releases/download'
    },
    edge: {
      version: '15063'
    }
  }
};

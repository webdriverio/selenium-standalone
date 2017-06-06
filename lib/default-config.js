module.exports = {
  baseURL: 'https://selenium-release.storage.googleapis.com',
  version: '3.4.0',
  drivers: {
    chrome: {
      version: '2.29',
      arch: process.arch,
      baseURL: 'https://chromedriver.storage.googleapis.com'
    },
    ie: {
      version: '3.4.0',
      arch: process.arch,
      baseURL: 'https://selenium-release.storage.googleapis.com'
    },
    edge: {
      version: '14393',
      arch: process.arch,
      baseURL: 'https://download.microsoft.com/download'
    },
    firefox: {
      version: '0.16.1',
      arch: process.arch,
      baseURL: 'https://github.com/mozilla/geckodriver/releases/download'
    }
  }
};

module.exports = {
  baseURL: 'http://selenium-release.storage.googleapis.com',
  version: '2.45.0',
  drivers: {
    chrome: {
      version: '2.15',
      arch: process.arch,
      baseURL: 'http://chromedriver.storage.googleapis.com'
    },
    ie: {
      version: '2.45.0',
      arch: process.arch,
      baseURL: 'http://selenium-release.storage.googleapis.com'
    }
  }
};

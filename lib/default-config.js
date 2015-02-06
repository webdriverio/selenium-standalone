module.exports = {
  baseURL: 'http://selenium-release.storage.googleapis.com',
  version: '2.44.0',
  drivers: {
    chrome: {
      version: '2.14',
      arch: process.arch,
      baseURL: 'http://chromedriver.storage.googleapis.com'
    },
    ie: {
      version: '2.44.0',
      arch: process.arch,
      baseURL: 'http://selenium-release.storage.googleapis.com'
    }
  }
};

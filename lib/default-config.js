module.exports = {
  baseURL: 'https://selenium-release.storage.googleapis.com',
  version: '2.50.1',
  drivers: {
    chrome: {
      version: '2.21',
      arch: process.arch,
      baseURL: 'https://chromedriver.storage.googleapis.com'
    },
    ie: {
      version: '2.50.0',
      arch: process.arch,
      baseURL: 'https://selenium-release.storage.googleapis.com'
    }
  }
};

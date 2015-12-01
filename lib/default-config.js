module.exports = {
  baseURL: 'https://selenium-release.storage.googleapis.com',
  version: '2.47.1',
  drivers: {
    chrome: {
      version: '2.18',
      arch: process.arch,
      baseURL: 'https://chromedriver.storage.googleapis.com'
    },
    ie: {
      version: '2.47.0',
      arch: process.arch,
      baseURL: 'https://selenium-release.storage.googleapis.com'
    }
  }
};

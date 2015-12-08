module.exports = {
  baseURL: 'https://selenium-release.storage.googleapis.com',
  version: '2.48.2',
  drivers: {
    chrome: {
      version: '2.20',
      arch: process.arch,
      baseURL: 'https://chromedriver.storage.googleapis.com'
    },
    ie: {
      version: '2.48.0',
      arch: process.arch,
      baseURL: 'https://selenium-release.storage.googleapis.com'
    }
  }
};

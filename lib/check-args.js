const debug = require('debug')('selenium-standalone:install');

const checkArgs = (fnName, opts = {}) => {
  debug(fnName + ' called with', opts);

  return { ...opts };
};

module.exports = {
  checkArgs,
};

const debug = require('debug')('selenium-standalone:install');

/**
 * @template T
 * @param {string} fnName
 * @param {T} [opts]
 * @returns {T}
 */
const checkArgs = (fnName, opts) => {
  debug(fnName + ' called with', opts);

  return { ...opts };
};

module.exports = {
  checkArgs,
};

const debug = require('debug')('selenium-standalone:install');

const checkArgs = (fnName, _opts, _cb) => {
  debug(fnName + ' called with', _opts);

  let opts = _opts;
  let cb = _cb;

  if (typeof opts === 'function') {
    cb = opts;
    opts = {};
  } else {
    opts = Object.assign({}, opts);
  }

  return { opts, cb };
};

module.exports = {
  checkArgs,
};

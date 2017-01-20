var debug = require('debug')('selenium-standalone:env-details');

debug('Platform:', process.platform);
debug('Architecture:', process.arch);
debug('Node.js:', process.version);
debug('CWD:', process.cwd());
debug('Module Path:', __dirname);
debug('Package Version:', require('../package.json').version);

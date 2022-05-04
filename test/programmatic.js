describe('programmatic use', function () {
  this.timeout(120000);

  const containsChrome = function (string) {
    return /chrome/i.test(string);
  };
  const testInstall = function (done, rawOptions, callback) {
    const selenium = require('../');
    // Capture the log output
    let log = '';
    const logger = function (message) {
      log += message;
    };
    const options = Object.assign({ logger: logger }, rawOptions);
    selenium
      .install(options)
      .catch(done)
      .then(() => {
        if (callback(log) !== false) {
          done();
        }
      });
  };
  const testStart = function (done, rawOptions, callback) {
    const selenium = require('../');
    const stdio = [
      'ignore', // stdin
      'pipe', // stdout
      'ignore', // stderr
    ];
    const options = Object.assign({}, rawOptions);
    options.spawnOptions = Object.assign({ stdio }, options.spawnOptions);
    selenium
      .start(options)
      .catch(done)
      .then((cp) => {
        cp.kill();
        let stdout = '';
        cp.stdout.on('data', (chunk) => (stdout += chunk));
        cp.stdout.on('end', () => {
          if (callback(stdout) !== false) {
            done();
          }
        });
      });
  };

  it('should install', (done) => {
    testInstall(done, {}, (log) => {
      if (!containsChrome(log)) {
        done(new Error('Chrome driver should be installed'));
        return false;
      }
    });
  });

  it('should install with the given drivers', (done) => {
    testInstall(done, { drivers: {} }, (log) => {
      if (containsChrome(log)) {
        done(new Error('Chrome driver should not be installed'));
        return false;
      }
    });
  });

  it('should start', (done) => {
    testStart(done, {}, (log) => {
      if (!containsChrome(log)) {
        done(new Error('Chrome driver should be loaded'));
        return false;
      }
    });
  });

  it('should start with custom seleniumArgs', (done) => {
    testStart(done, { seleniumArgs: ['--port', '12345'] }, (log) => {
      if (!containsChrome(log)) {
        done(new Error('Chrome driver should be loaded'));
        return false;
      }
    });
  });

  it('should start with the given drivers', (done) => {
    testStart(done, { drivers: { firefox: {} } }, (log) => {
      if (containsChrome(log)) {
        done(new Error('Chrome driver should not be loaded'));
        return false;
      }
    });
  });

  it('should start and merge drivers', (done) => {
    const options = { seleniumArgs: ['--port', '4445'], drivers: { chrome: {} } };
    testStart(done, options, (log) => {
      if (!containsChrome(log)) {
        done(new Error('Chrome driver should be loaded'));
        return false;
      }
    });
  });

  it('should start with singleDriverStart options', (done) => {
    testStart(
      done,
      { singleDriverStart: 'firefox', drivers: { chrome: {}, firefox: {} }, seleniumArgs: ['--port', '4446'] },
      (log) => {
        if (containsChrome(log)) {
          done(new Error('Chrome driver should not be loaded'));
          return false;
        }
      }
    );
  });
});

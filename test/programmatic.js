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
    selenium.install(options, (err) => {
      if (err) {
        done(err);
        return;
      }
      if (callback(log) !== false) {
        done();
      }
    });
  };
  const testStart = function (done, options, callback) {
    const selenium = require('../');
    selenium.start(options, (err, cp) => {
      if (err) {
        done(err);
        return;
      }
      cp.kill();
      if (callback(cp) !== false) {
        done();
      }
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
    testStart(done, {}, (cp) => {
      if (cp.spawnargs && !cp.spawnargs.some(containsChrome)) {
        done(new Error('Chrome driver should be loaded'));
        return false;
      }
    });
  });

  it('should start with custom seleniumArgs', (done) => {
    testStart(done, { seleniumArgs: ['-port', '12345'] }, (cp) => {
      if (cp.spawnargs && !cp.spawnargs.some(containsChrome)) {
        done(new Error('Chrome driver should be loaded'));
        return false;
      }
    });
  });

  it('should start with the given drivers', (done) => {
    testStart(done, { drivers: {} }, (cp) => {
      if (cp.spawnargs && cp.spawnargs.some(containsChrome)) {
        done(new Error('Chrome driver should not be loaded'));
        return false;
      }
    });
  });

  it('should start and merge drivers', (done) => {
    const options = { drivers: { chrome: {} } };
    testStart(done, options, (cp) => {
      if (cp.spawnargs && !cp.spawnargs.some(containsChrome)) {
        done(new Error('Chrome driver should be loaded'));
        return false;
      }
    });
  });

  it('can listen to stderr', (done) => {
    const selenium = require('../');
    selenium.start((err, cp) => {
      if (err) {
        done(err);
        return;
      }

      cp.stderr.once('data', () => {
        cp.kill();
        done();
      });
    });
  });
});

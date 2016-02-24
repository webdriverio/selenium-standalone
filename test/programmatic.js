describe('programmatic use', function () {
  var containsChrome = function(arg) {
    return /chrome/i.test(arg);
  };

  it('should start', function(done) {
    this.timeout(60000);
    var selenium = require('../');
    selenium.start(function(err, cp) {
      if (err) {
        done(err);
        return;
      }

      if (cp.spawnargs && !cp.spawnargs.some(containsChrome)) {
        done(new Error('Chrome driver should be loaded'));
      }

      cp.kill();
      done();
    });
  });

  it('should use the given drivers', function(done) {
    this.timeout(60000);
    var selenium = require('../');
    var options = {
      drivers: {} // only built-in Firefox
    };
    selenium.start(options, function(err, cp) {
      if (err) {
        done(err);
        return;
      }

      if (cp.spawnargs && cp.spawnargs.some(containsChrome)) {
        done(new Error('Chrome driver should not be loaded'));
      }

      cp.kill();
      done();
    });
  });

  it('can listen to stderr', function(done) {
    this.timeout(60000);
    var selenium = require('../');
    selenium.start(function(err, cp) {
      if (err) {
        done(err);
        return;
      }

      cp.stderr.once('data', function() {
        cp.kill();
        done();
      });
    });
  });
});

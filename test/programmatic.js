describe('programmatic use', function () {
  it('should start', function(done) {
    this.timeout(60000);
    var selenium = require('../');
    selenium.start(function(err, cp) {
      if (err) {
        done(err);
        return;
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

describe('advanced programmatic use', function () {
  it('should start', function(done) {
    this.timeout(20000);
    var selenium = require('../index.js');
    selenium({ stdio: 'pipe' }, function started(err, proc) {
      if (err) {
        done(err);
        return;
      }

      proc.kill();
      done();
    });
  });
});

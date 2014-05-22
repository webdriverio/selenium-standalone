describe('programmatic use', function () {
  it('should start', function(done) {
    this.timeout(20000);
    var timedout;
    var selenium = require('./index.js');
    var proc = selenium.start({ stdio: 'pipe' });

    proc.stdout.on('data', function(data) {
      var line = data.toString().trim();
      if (line.indexOf('Started SocketListener on 0.0.0.0:4444') > -1) {
        proc.kill();
        clearTimeout(timedout);
        done();
      }
    });

    timedout = setTimeout(function() {
      proc.kill();
      done(new Error('Server never started'));
    }, 20000);
  })
});
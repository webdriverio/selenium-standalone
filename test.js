var selenium = require('./index.js');
var proc = selenium.start({ stdio: 'pipe' });

proc.stdout.on('data', function(data) {
  var line = data.toString().trim();
  if (line.indexOf('Started SocketListener on 0.0.0.0:4444') > -1)
    process.exit(0);
  else
    console.log(line);
});

setTimeout(function() {
  console.log('Server never started');
  process.exit(1);
}, 5000);
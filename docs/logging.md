### Logging

#### Selenium Process

By default, Selenium sends [logging messages to stderr](https://code.google.com/p/selenium/issues/detail?id=7957).

The selenium-standalone cli tool (`selenium-standalone start`) will output the logging messages to your `process.stderr`. So you do see them in the console.

If you are using the programmatic API, you can retrieve the `stderr` messages by doing this:

```js
const selenium = require('selenium-standalone');
selenium.start(function(err, child) {
  child.stderr.on('data', function(data){
    console.log(data.toString());
  });
});
```

You can also forward the `stderr` to your `process.stderr` like the cli does:

```js
const selenium = require('selenium-standalone');
selenium.start({
  spawnOptions: {
      stdio: 'inherit'
  }
}, function(err, child) {
  // child.stderr now sent to your `process.stderr`
});
```

#### Debug Logs for Selenium Standalone Process

At times you may need to get debug logs for what `selenium-standalone` is doing. In your environment variables set `DEBUG=selenium-standalone:*`. This will enable extra log statements to be shown in stderr.

**Example:**
```text
$ DEBUG=selenium-standalone:* selenium-standalone install --drivers.chrome.version=87.0.4280.20
  selenium-standalone:env-details Platform: darwin 19.6.0 +0ms
  selenium-standalone:env-details Architecture: x64 +1ms
  selenium-standalone:env-details Node.js: v12.18.4 +0ms
  selenium-standalone:env-details Package Version: 6.21.0 +0ms
  selenium-standalone:cli Started via CLI with:  [ '/usr/local/bin/node',
  '/tmp/selenium-standalone/bin/selenium-standalone',
  'install',
  '--drivers.chrome.version=87.0.4280.20' ]
  ...
```

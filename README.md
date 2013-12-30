# selenium-standalone

Intalls a `start-selenium` command line starting a selenium standalone
server along with the chromedriver.

Currently installs selenium `2.37.0` and chrome driver `2.6`.

```shell
npm install selenium-standalone -g
start-selenium
```

## Example: launch www.google.com

Using a selenium driver like [wd](https://github.com/admc/wd):

```shell
npm install wd -g
wd shell
(wd): browser = wd.remote(); browser.init(function(){browser.get('http://www.google.com')})
```

## Programmatic use

```
var selenium = require('selenium-standalone');
var spawnOptions = { stdio: 'pipe' };
var server = selenium.start(spawnOptions);

server.stdout.on('data', function(output) {
  console.log(output);
});
```

`selenium-standalone` versions maps `selenium` versions.

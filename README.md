# selenium-standalone

Intalls a `start-selenium` command line starting a selenium standalone
server along with the chromedriver.

Currently installs selenium `2.37.0` and chrome driver `2.6`.

```shell
npm install --production selenium-standalone -g
start-selenium
```

Any arguments passed to `start-selenium` are then passed to
`java -jar ...jar args`.

So you can `start-selenium -debug` to launch standalone selenium server
in debug mode.

## Available browsers

By default, google chrome, firefox and phantomjs are available
if installed on the sytem.

## Example: launch www.google.com

Using a selenium driver like [wd](https://github.com/admc/wd):

```shell
npm install wd -g
wd shell
(wd): browser = wd.remote(); browser.init(function(){browser.get('http://www.google.com')})
```

## Programmatic use

```js
var selenium = require('selenium-standalone');

var spawnOptions = { stdio: 'pipe' };

// options to pass to `java -jar selenium-server-standalone-X.XX.X.jar`
var seleniumArgs = [
  '-debug'
];

var server = selenium(spawnOptions, seleniumArgs);
// or, var server = selenium();
// returns ChildProcess instance
// http://nodejs.org/api/child_process.html#child_process_class_childprocess

// spawnOptions defaults to `{ stdio: 'pipe' }`
// seleniumArgs defaults to `[]`

server.stdout.on('data', function(output) {
  console.log(output);
});
```

`selenium-standalone` versions maps `selenium` versions.

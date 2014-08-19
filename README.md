# selenium-standalone
[![Dependency Status](https://david-dm.org/vvo/selenium-standalone.svg?theme=shields.io)](https://david-dm.org/vvo/selenium-standalone) [![devDependency Status](https://david-dm.org/vvo/selenium-standalone/dev-status.svg?theme=shields.io)](https://david-dm.org/vvo/selenium-standalone#info=devDependencies)

Command line or programmatic install and launch of latest selenium standalone
server and chrome driver.

It will install a `start-selenium`.

Currently installs selenium `2.42.2` and chrome driver `2.9`.

```shell
npm install --production selenium-standalone@latest -g
start-selenium
```

Any arguments passed to `start-selenium` are then passed to
`java -jar ...jar args`.

So you can `start-selenium -debug` to launch standalone selenium server
in debug mode.

## Running headlessly

On linux,

To run headlessly, you can use [xvfb](http://en.wikipedia.org/wiki/Xvfb):

```shell
xvfb-run --server-args="-screen 0, 1366x768x24" start-selenium
```

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

// spawnOptions defaults to `{ stdio: 'inherit' }`
// seleniumArgs defaults to `[]`

server.stdout.on('data', function(output) {
  console.log(output);
});
```

`selenium-standalone` versions maps `selenium` versions.

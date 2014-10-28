# selenium-standalone

[![Build Status](http://img.shields.io/travis/vvo/selenium-standalone/master.svg?style=flat-square)](https://travis-ci.org/vvo/selenium-standalone)
[![Dependency Status](http://img.shields.io/david/vvo/selenium-standalone.svg?style=flat-square)](https://david-dm.org/vvo/selenium-standalone)
[![devDependency Status](http://img.shields.io/david/dev/vvo/selenium-standalone.svg?style=flat-square)](https://david-dm.org/vvo/selenium-standalone#info=devDependencies)

Command line or programmatic install and launch of latest [selenium](http://www.seleniumhq.org/download/) standalone
server, [chrome driver](https://code.google.com/p/selenium/wiki/ChromeDriver) and [internet explorer driver](https://code.google.com/p/selenium/wiki/InternetExplorerDriver).

It will install a `start-selenium` command line that will be able to launch firefox, chrome, internet explorer or phantomjs for your tests.

Currently installs selenium `2.44.0`, chrome driver `2.12` and internet explorer driver `2.44.0`.

```shell
npm install selenium-standalone@latest -g
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

## IEDriverServer architecture

IEDriverServer 32/64bit version is downloaded according to processor architecture. There are [known issues with sendkeys](https://code.google.com/p/selenium/issues/detail?id=5116) being slow on 64bit version of Internet Explorer. To address this issue, IEDriverServer architecture can be configured using IEDRIVER_ARCH environment variable. Supported values are `ia32` and `x64`.

### Example: Force 32bit IEDriverServer to be used

```shell
set IEDRIVER_ARCH=ia32
npm install selenium-standalone@latest -g
start-selenium
```

`selenium-standalone` versions maps `selenium` versions.

# selenium-standalone [![Build Status](http://img.shields.io/travis/vvo/selenium-standalone/master.svg?style=flat-square)](https://travis-ci.org/vvo/selenium-standalone) [![Dependency Status](http://img.shields.io/david/vvo/selenium-standalone.svg?style=flat-square)](https://david-dm.org/vvo/selenium-standalone) [![devDependency Status](http://img.shields.io/david/dev/vvo/selenium-standalone.svg?style=flat-square)](https://david-dm.org/vvo/selenium-standalone#info=devDependencies)

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/vvo/selenium-standalone?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Command line or programmatic install and launch of [selenium](http://www.seleniumhq.org/download/) standalone
server, [chrome driver](https://code.google.com/p/selenium/wiki/ChromeDriver), [internet explorer driver](https://code.google.com/p/selenium/wiki/InternetExplorerDriver), [firefox driver](https://code.google.com/p/selenium/wiki/FirefoxDriver) and phantomjs

It will install a `selenium-standalone` command line that will be able to `install` selenium server and `start` firefox, chrome, internet explorer or phantomjs for your tests.

```shell
npm install selenium-standalone@latest -g
selenium-standalone install
selenium-standalone start
```

![screencast](screencast.gif)

## Command line API

```shell
# simple, use defaults and latest selenium
selenium-standalone install
selenium-standalone start

# specify selenium args, everything after -- is for selenium
selenium-standalone start -- -debug

# choose selenium version
selenium-standalone install --version=2.45.0 --baseURL=http://selenium-release.storage.googleapis.com

# choose chrome driver version
selenium-standalone install --drivers.chrome.version=2.15 --drivers.chrome.baseURL=http://chromedriver.storage.googleapis.com

# choose ie driver architecture
selenium-standalone start --drivers.ie.arch=ia32 --drivers.ie.baseURL=http://selenium-release.storage.googleapis.com
```

## Programmatic API

### Example

```js
var selenium = require('selenium-standalone');

selenium.install({
  // check for more recent versions of selenium here:
  // http://selenium-release.storage.googleapis.com/index.html
  version: '2.45.0',
  baseURL: 'http://selenium-release.storage.googleapis.com',
  drivers: {
    chrome: {
      // check for more recent versions of chrome driver here:
      // http://chromedriver.storage.googleapis.com/index.html
      version: '2.15',
      arch: process.arch,
      baseURL: 'http://chromedriver.storage.googleapis.com'
    },
    ie: {
      // check for more recent versions of internet explorer driver here:
      // http://selenium-release.storage.googleapis.com/index.html
      version: '2.45',
      arch: process.arch,
      baseURL: 'http://selenium-release.storage.googleapis.com'
    }
  },
  logger: function(message) {

  },
  progressCb: function(totalLength, progressLength, chunkLength) {

  }
}, cb);
```

### selenium.install([opts,] cb)

`opts.version` [selenium version](http://selenium-release.storage.googleapis.com/index.html) to install.

`opts.drivers` map of drivers to download and install along with selenium standalone server.

Here are the current defaults:

```js
{
  chrome: {
    version: '2.15',
    arch: process.arch,
    baseURL: 'http://chromedriver.storage.googleapis.com'
  },
  ie: {
    version: '2.45.0',
    arch: process.arch,
    baseURL: 'http://selenium-release.storage.googleapis.com'
  }
}
```

`arch` is either `ia32` or `x64`, it's here because you might want to switch to a particular
arch [sometimes](https://code.google.com/p/selenium/issues/detail?id=5116#c9).

`baseURL` is used to find the server having the selenium or drivers files.

`opts.progressCb(totalLength, progressLength, chunkLength)` will be called if provided with raw bytes length numbers about the current download process. It is used by the command line to show a progress bar.

`opts.logger` will be called if provided with some debugging information about the installation process.

`cb(err)` called when install finished or errored.

### selenium.start([opts,] cb)

`opts.drivers` map of drivers to run along with selenium standalone server, same
as `selenium.install`.

By default all drivers are loaded, you only control and change the versions or archs.

`opts.spawnOptions` [spawn options](http://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options) for the selenium server. Defaults to `undefined`

`opts.seleniumArgs` array of arguments for the selenium server, passed directly to [child_process.spawn](http://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options). Defaults to `[]`.

`opts.spawnCb` will be called if provided as soon as the selenium child process was spawned. It may be interesting if you want to do some more debug.

`opts.javaPath` set the javaPath manually, otherwise we use `[which](https://github.com/isaacs/node-which).sync('java')`

`cb(err, child)` called when the server is running and listening, child is the [ChildProcess](http://nodejs.org/api/child_process.html#child_process_class_childprocess) instance created.

So you can `child.kill()` when you are done.

## Available browsers

By default, google chrome, firefox and phantomjs are available
when installed on the sytem.

## Tips

### Start Selenium whenever your (ubuntu) machine starts!

After installing selenium-standalone globally, execute the following commands to run selenium-standalone when your machine starts!

```shell
ln -s /usr/local/bin/selenium-standalone /etc/init.d/
update-rc.d selenium-standalone defaults
```
For more information: http://stackoverflow.com/questions/3666794/selenium-server-on-startup/30392437#30392437


### Running headlessly

On linux,

To run headlessly, you can use [xvfb](http://en.wikipedia.org/wiki/Xvfb):

```shell
xvfb-run --server-args="-screen 0, 1366x768x24" selenium-standalone start
```

### Logging

By default, Selenium sends [logging messages to stderr](https://code.google.com/p/selenium/issues/detail?id=7957).

The selenium-standalone cli tool (`selenium-standalone start`) will output the logging messages to your `process.stderr`. So you do see them in the console.

If you are using the programmatic API, you can retrieve the `stderr` messages by doing this:

```js
var selenium = require('selenium-standalone');
selenium.start(function(err, child) {
  child.stderr.on('data', function(data){
    console.log(data.toString());
  });
});
```

You can also forward the `stderr` to your `process.stderr` like the cli does:

```js
var selenium = require('selenium-standalone');
selenium.start({
  spawnOptions: {
      stdio: 'inherit'
  }
}, function(err, child) {
  // child.stderr now sent to your `process.stderr`
});
```

### Examples of combining with other tools

- [Gulp + WebdriverIO + Mocha](http://twin.github.io/selenium-testing-workflow-with-webdriverio/)

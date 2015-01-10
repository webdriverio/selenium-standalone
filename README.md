# selenium-standalone

[![Build Status](http://img.shields.io/travis/vvo/selenium-standalone/master.svg?style=flat-square)](https://travis-ci.org/vvo/selenium-standalone)
[![Dependency Status](http://img.shields.io/david/vvo/selenium-standalone.svg?style=flat-square)](https://david-dm.org/vvo/selenium-standalone)
[![devDependency Status](http://img.shields.io/david/dev/vvo/selenium-standalone.svg?style=flat-square)](https://david-dm.org/vvo/selenium-standalone#info=devDependencies)

Command line or programmatic install and launch of [selenium](http://www.seleniumhq.org/download/) standalone
server, [chrome driver](https://code.google.com/p/selenium/wiki/ChromeDriver), [internet explorer driver](https://code.google.com/p/selenium/wiki/InternetExplorerDriver), [firefox driver](https://code.google.com/p/selenium/wiki/FirefoxDriver) and phantomjs

It will install a `selenium-standalone` command line that will be able to `install` selenium server and `start` firefox, chrome, internet explorer or phantomjs for your tests.

```shell
npm install selenium-standalone@latest -g
selenium-standalone install
selenium-standalone start
```

## Command line API

```shell
# simple, use defaults and latest selenium
selenium-standalone install
selenium-standalone start

# specify selenium args, everything after -- is for selenium
selenium-standalone start -- -debug

# choose selenium version
selenium-standalone install --version=2.44.0

# choose chrome driver version
selenium-standalone install --drivers.chrome.version=2.13

# choose ie driver architecture
selenium-standalone start --drivers.ie.arch=ia32
```

## Programmatic API

### Example

```js
var selenium = require('selenium-standalone');

selenium.install({
  version: '2.44.0',
  drivers: {
    chrome: {
      version: '2.13',
      arch: process.arch
    },
    ie: {
      version: '2.44',
      arch: process.arch
    }
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
    version: '2.13',
    arch: process.arch
  },
  ie: {
    version: '2.44.0',
    arch: process.arch
  }
}
```

`arch` is either `ia32` or `x64`, it's here because you might want to switch to a particular
arch [sometimes](https://code.google.com/p/selenium/issues/detail?id=5116#c9).

`cb(err)` called when install finished or errored.

### selenium.start([opts,] cb)

`opts.drivers` map of drivers to run along with selenium standalone server, same
as `selenium.install`.

By default all drivers are loaded, you only control and change the versions or archs.

`opts.spawnOptions` [spawn options](http://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options) for the selenium server. Defaults to `undefined`

`opts.seleniumArgs` array of arguments for the selenium server, passed directly to [child_process.spawn](http://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options). Defaults to `[]`.

`cb(err, child)` called when the server is running and listening, child is the [ChildProcess](http://nodejs.org/api/child_process.html#child_process_class_childprocess) instance created.

So you can `child.kill()` when you are done.

## Available browsers

By default, google chrome, firefox and phantomjs are available
when installed on the sytem.

## Tips

### Running headlessly

On linux,

To run headlessly, you can use [xvfb](http://en.wikipedia.org/wiki/Xvfb):

```shell
xvfb-run --server-args="-screen 0, 1366x768x24" selenium-standalone start
```

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Application Programming Interface (API)](#application-programming-interface-api)
  - [Sample configuration object](#sample-configuration-object)
  - [Example](#example)
  - [selenium.install([opts])](#seleniuminstallopts)
  - [selenium.start([opts])](#seleniumstartopts)
  - [Error: Port 4444 is already in use.](#error-port-4444-is-already-in-use)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Application Programming Interface (API)

## Sample configuration object

Here you can find an up-to-date example of the configuration object:
[lib/default-config.js](../lib/default-config.js)

## Example

```js
const selenium = require('selenium-standalone');

async function myFn() {
  //result is obj with paths to binary and some info like urls to installed files { fsPaths, urls, opts }
  const details = await selenium.install({
    // check for more recent versions of selenium here:
    // https://selenium-release.storage.googleapis.com/index.html
    version: process.env.SELENIUM_VERSION || '4.10.0',
    baseURL: 'https://selenium-release.storage.googleapis.com',
    drivers: {
      chrome: {
        // check for more recent versions of chrome driver here:
        // https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing
        version: 'latest',
        arch: process.arch,
        baseURL: 'https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing'
        channel: 'stable', //option
      }
    }
  });

  const seleniumChildProcess = await selenium.start({
    drivers: {
      chrome: {
        version: 'latest',
      },
    }
  });

  //or
  //staring drivers 'chrome' | 'firefox' | 'chromiumedge' without selenium-server
  const chromeDriverChildProcess = await selenium.start({
    onlyDriver: 'chrome'
    drivers: {
      chrome: {
        version: 'latest',
        onlyDriverArgs: [],//option
      },
    }
  });

  // run tests

  // finally kill selenium process!
  seleniumChildProcess.kill();
}
```

## selenium.install([opts])

`opts.version` [selenium version](https://selenium-release.storage.googleapis.com/index.html) to install.

`opts.drivers` map of drivers to download and install along with selenium standalone server.

The current defaults can be found in [lib/default-config.js](../lib/default-config.js).

`opts.arch` is either `ia32` or `x64`, it's here because you might want to switch to a particular
arch [sometimes](https://code.google.com/p/selenium/issues/detail?id=5116#c9).

`opts.baseURL` is used to find the server having the selenium or drivers files.

`opts.fullURL` as an alternative to baseURL it's possible specify full url, ex `https://selenium-release.storage.googleapis.com/4.0-alpha-7/selenium-server-4.0.0-alpha-7.jar`.

`opts.ignoreExtraDrivers` only downloads and installs drivers explicitly specified. Broken https://github.com/webdriverio/selenium-standalone/issues/421

`opts.basePath` sets the base directory used to store the selenium standalone `.jar` and drivers. Defaults to `node_modules/selenium-standalone/.selenium`

`opts.progressCb(totalLength, progressLength, chunkLength)` will be called if provided with raw bytes length numbers about the current download process. It is used by the command line to show a progress bar.

`opts.logger` will be called if provided with some debugging information about the installation process.

`opts.requestOpts` can be any valid [`got` options object](https://www.npmjs.com/package/got#proxies). You can use this for example to set a timeout.

`opts.onlyDriver` can be any valid 'chrome' | 'firefox' | 'chromiumedge' it allow to install any driver without selenium server, driver also can be parametrized with onlyDriverArgs, it's []

returns `Promise<void>`

## selenium.start([opts])

`opts.version` [selenium version](https://selenium-release.storage.googleapis.com/index.html) to install.

`opts.drivers` map of drivers to run along with selenium standalone server, same
as `selenium.install`.

`opts.ignoreExtraDrivers` only loads and starts drivers explicitly specified.

`opts.basePath` sets the base directory used to load the selenium standalone `.jar` and drivers, same as `selenium.install`.

By default all drivers are loaded, you only control and change the versions or archs.

`opts.spawnOptions` [spawn options](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options) for the selenium server. Defaults to `undefined`

`opts.javaArgs` array of arguments for the JVM, included between `java` and `-jar` in the command line invocation. Use this option to set properties like `-Xmx=512M` or `-Djava.util.logging.config.file=logging.properties`, for instance. Defaults to `[]`.

`opts.seleniumArgs` array of arguments for the selenium server, passed directly to [child_process.spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options). Defaults to `[]`.

`opts.javaPath` set the javaPath manually, otherwise we use `[which](https://github.com/isaacs/node-which).sync('java')`.

`opts.requestOpts` can be any valid [`got` options object](https://www.npmjs.com/package/got#proxies). You can use this for example to set a timeout.

`opts.processKiller` set to falsy value, for preventing killing selenium server port.

`opts.onlyDriver` can be any valid 'chrome' | 'firefox' | 'chromiumedge' it allow to start any driver directly without selenium server

returns `Promise<ChildProcess>`

## Error: Port 4444 is already in use.

If you're getting this error, it means that you didn't shut down the server successfully the last time you started it, so it's still running in the background. You can kill it by running:

```shell
pkill -f selenium-standalone
```

since 9.1.0 it's been checked and killed automatically

## Set `selenium-standalone` Version as NodeJS environment parameter

You can set any version by `process.env.SELENIUM_VERSION=3.141.59` before starting selenium-standalone. Default values are here: [lib/default-config.js](../lib/default-config.js)

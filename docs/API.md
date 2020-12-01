<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Application Programming Interface (API)](#application-programming-interface-api)
  - [Sample configuration object](#sample-configuration-object)
  - [Example](#example)
  - [selenium.install([opts,] cb)](#seleniuminstallopts-cb)
  - [selenium.start([opts,] cb)](#seleniumstartopts-cb)
      - [`Error: Another Selenium process is already running`](#error-another-selenium-process-is-already-running)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Application Programming Interface (API)

## Sample configuration object

Here you can find an up-to-date example of the configuration object:
[lib/default-config.js](lib/default-config.js)

## Example

```js
const selenium = require('selenium-standalone');

selenium.install({
  // check for more recent versions of selenium here:
  // https://selenium-release.storage.googleapis.com/index.html
  version: '3.141.59',
  baseURL: 'https://selenium-release.storage.googleapis.com',
  drivers: {
    chrome: {
      // check for more recent versions of chrome driver here:
      // https://chromedriver.storage.googleapis.com/index.html
      version: '87.0.4280.20',
      arch: process.arch,
      baseURL: 'https://chromedriver.storage.googleapis.com'
    },
    ie: {
      // check for more recent versions of internet explorer driver here:
      // https://selenium-release.storage.googleapis.com/index.html
      version: '3.150.0',
      arch: process.arch,
      baseURL: 'https://selenium-release.storage.googleapis.com'
    }
  },
  ignoreExtraDrivers: true,
  proxy: 'http://localproxy.com', // see https://www.npmjs.com/package/got#proxies
  requestOpts: { // see https://www.npmjs.com/package/got
    timeout: 10000
  },
  logger: function(message) {

  },
  progressCb: function(totalLength, progressLength, chunkLength) {

  }
}, cb);
```

## selenium.install([opts,] cb)

`opts.version` [selenium version](https://selenium-release.storage.googleapis.com/index.html) to install.

`opts.drivers` map of drivers to download and install along with selenium standalone server.

The current defaults can be found in [lib/default-config.js](lib/default-config.js).

`arch` is either `ia32` or `x64`, it's here because you might want to switch to a particular
arch [sometimes](https://code.google.com/p/selenium/issues/detail?id=5116#c9).

`baseURL` is used to find the server having the selenium or drivers files.

`fullURL` as an alternative to baseURL it's possible specify full url, ex `https://selenium-release.storage.googleapis.com/4.0-alpha-7/selenium-server-4.0.0-alpha-7.jar`.

`opts.ignoreExtraDrivers` only downloads and installs drivers explicity specified.

`opts.basePath` sets the base directory used to store the selenium standalone `.jar` and drivers. Defaults to current working directory + .selenium/

`opts.progressCb(totalLength, progressLength, chunkLength)` will be called if provided with raw bytes length numbers about the current download process. It is used by the command line to show a progress bar.

`opts.logger` will be called if provided with some debugging information about the installation process.

`opts.requestOpts` can be any valid [`got` options object](https://www.npmjs.com/package/got#proxies). You can use this for example to set a timeout.

`cb(err)` called when install finished or errored.

## selenium.start([opts,] cb)

`opts.version` [selenium version](https://selenium-release.storage.googleapis.com/index.html) to install.

`opts.drivers` map of drivers to run along with selenium standalone server, same
as `selenium.install`.

`opts.ignoreExtraDrivers` only loads and starts drivers explicity specified.

`opts.basePath` sets the base directory used to load the selenium standalone `.jar` and drivers, same as `selenium.install`.

By default all drivers are loaded, you only control and change the versions or archs.

`opts.spawnOptions` [spawn options](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options) for the selenium server. Defaults to `undefined`

`opts.javaArgs` array of arguments for the JVM, included between `java` and `-jar` in the command line invocation. Use this option to set properties like `-Xmx=512M` or `-Djava.util.logging.config.file=logging.properties`, for instance. Defaults to `[]`.

`opts.seleniumArgs` array of arguments for the selenium server, passed directly to [child_process.spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options). Defaults to `[]`.

`opts.spawnCb` will be called if provided as soon as the selenium child process was spawned. It may be interesting if you want to do some more debug.

`opts.javaPath` set the javaPath manually, otherwise we use `[which](https://github.com/isaacs/node-which).sync('java')`.

`opts.requestOpts` can be any valid [`got` options object](https://www.npmjs.com/package/got#proxies). You can use this for example to set a timeout.

`cb(err, child)` called when the server is running and listening, child is the [ChildProcess](https://nodejs.org/api/child_process.html#child_process_class_childprocess) instance created.

So you can `child.kill()` when you are done.

#### `Error: Another Selenium process is already running`

If you're getting this error, it means that you didn't shut down the server successfully the last time you started it, so it's still running in the background. You can kill it by running:

```shell
pkill -f selenium-standalone
```

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Command line interface](#command-line-interface)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Command line interface

```shell
# simple, use defaults and latest selenium
selenium-standalone install
selenium-standalone start

# install defaults, but silently
selenium-standalone install --silent

# specify selenium args, everything after -- is for selenium
selenium-standalone start -- -debug

# choose selenium version
selenium-standalone install --version=3.141.59 --baseURL=https://selenium-release.storage.googleapis.com

# exact selenium download url
selenium-standalone install --version=4.0.0-alpha-7 --fullURL=https://selenium-release.storage.googleapis.com/4.0-alpha-7/selenium-server-4.0.0-alpha-7.jar

# choose chrome driver version
selenium-standalone install --drivers.chrome.version=87.0.4280.20 --drivers.chrome.baseURL=https://chromedriver.storage.googleapis.com

# choose ie driver architecture
selenium-standalone start --drivers.ie.arch=ia32 --drivers.ie.baseURL=https://selenium-release.storage.googleapis.com

# install a single driver within the default list (chrome, ie, edge, firefox, chromiumedge)
selenium-standalone install --singleDriverInstall=chrome

# specify hub and nodes to setup your own selenium grid
selenium-standalone start -- hub
selenium-standalone start -- node --grid-url http://localhost:4444/grid/register
selenium-standalone start -- node --grid-url http://localhost:4444/grid/register --port 5556

# start a single driver
selenium-standalone start --singleDriverStart=chrome

# don't forget to specify downloaded version for v4 alpha
./bin/selenium-standalone start --version=4.0.0-alpha-7

# If you have a complex configuration with numerous options or if you want to keep a clear configuration changes history,
# you can specify the options in a configuration file :
selenium-standalone install --config=/path/to/config.json
selenium-standalone start --config=./config/seleniumConfig.js

# prevent killing selenium process before start
selenium-standalone start --processKiller=false

# install or start only certain driver
selenium-standalone install --onlyDriver=chrome
selenium-standalone start --onlyDriver=chrome

```

Config file can be a JSON file or a [module file](https://nodejs.org/api/modules.html#modules_file_modules) that exports options as an object:

```js
module.exports = {
  drivers: {
    chrome: {
      version: '87.0.4280.20',
      arch: process.arch,
      baseURL: 'https://chromedriver.storage.googleapis.com'
    },
  },
}
```

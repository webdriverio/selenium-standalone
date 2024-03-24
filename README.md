Node.js Selenium Standalone [![Test](https://github.com/webdriverio/selenium-standalone/actions/workflows/test.yml/badge.svg?branch=main&event=push)](https://github.com/webdriverio/selenium-standalone/actions/workflows/test.yml) ![Supported node versions](https://img.shields.io/badge/node-12%2C%2013%2C%2014%2C%2015%2C%2016%2C%2017%2C%2018%2C%2019%2C%2020-green)
===========================

> A node based CLI library for launching [Selenium](http://www.seleniumhq.org/download/) with [WebDriver](https://w3c.github.io/webdriver/) support.

Supported Drivers:

 * [ChromeDriver](https://github.com/SeleniumHQ/selenium/wiki/ChromeDriver)
 * [geckodriver](https://github.com/mozilla/geckodriver/releases) (Firefox)
 * [IEDriver](https://github.com/SeleniumHQ/selenium/wiki/InternetExplorerDriver)
 * [Edge WebDriver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/#downloads)
 * [Chromium Edge WebDriver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/#downloads)

## Available browsers

By default, Google Chrome, Firefox and Microsoft Edge are available when installed on the host system.

Starting from `v6.22` chrome, edgechromium, and geckodriver support `latest` as version.

Starting from `v9.0.6` supported changes regarding new storage for `latest` versions of chromedriver.

Starting from `v9.2.0` added new feature 'onlyDriver'

## Install & Run

### As Global NPM Package

```shell
npm install selenium-standalone -g
selenium-standalone install && selenium-standalone start
```

### As a Local NPM Package

```shell
npm install selenium-standalone --save-dev
npx selenium-standalone install && npx selenium-standalone start
```

### As a Docker Service

```shell
docker run -it -p 4444:4444 webdriverio/selenium-standalone
```

If you run Chrome or Firefox tests within a Docker container make sure you set capabilities so that the session is headless, e.g.:

```js
capabilities: {
  browserName: 'chrome',
  'goog:chromeOptions': {
    args: ['--no-sandbox', '--headless']
  }
}
```

or Firefox:

```js
capabilities: {
  browserName: 'firefox',
  'moz:firefoxOptions': {
    args: ['-headless']
  }
}
```

If you are looking for more sophisticated Docker container that allows you to run browser, check out the [Docker Selenium](https://github.com/SeleniumHQ/docker-selenium) project.

## Command line interface ([CLI](./docs/CLI.md))

See [CLI](./docs/CLI.md) docs

## Application Programming Interface ([API](./docs/API.md))

See [API](./docs/API.md) docs

## Tips

- [Start Selenium whenever your (ubuntu) machine starts!](./docs/run-when-system-starts.md)
- [Ensure you have the minimum required Java version](./docs/java-versions.md)
- [Logging](./docs/logging.md)
- [`Error: unable to get local issuer certificate`](./docs/issuer-cerificate.md)
- [Running headlessly with xvfb](./docs/xvfb.md)

### Examples of combining with other tools

- [WebdriverIO + Jasmine](https://github.com/mgrybyk/wdio-jasmine-boilerplate) in CircleCI
- [WebdriverIO + Cucumber](https://gitlab.com/bar_foo/wdio-cucumber-typescript) in GitLab

## :woman_technologist: :man_technologist: Contributing

You like this project and want to help making it better? Awesome! Have a look into our [Contributor Documentation](CONTRIBUTING.md) to get started with setting up the repo.

If you're looking for issues to help out with, check out [the issues labelled "good first pick"](https://github.com/webdriverio/selenium-standalone/issues?q=is%3Aopen+is%3Aissue+label%3A"good+first+pick"). You can also reach out in our [Gitter Channel](https://gitter.im/webdriverio/webdriverio) if you have question on where to start contributing.

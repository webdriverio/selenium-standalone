# selenium-standalone

Intalls a `start-selenium` command line starting a selenium standalone
server along with the chromedriver.

Currently installs selenium `2.35.0` and chrome driver `2.3`.

```shell
npm install start-selenium -g
start-selenium
```

## Example: launch www.google.com

Using a selenium driver like [wd](https://github.com/admc/wd):

```shell
npm install wd -g
wd shell
(wd): browser = wd.remote(); browser.init(function(){browser.get('http://www.google.com')})
```

`selenium-standalone` versions maps `selenium` versions.
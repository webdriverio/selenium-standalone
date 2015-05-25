# 4.4.2 (2015-05-25)

  * fix: programmatic usage was broken

# 4.4.1 (2015-05-25)

  * fix: use isaacs/node-which instead of vvo/whereis to find JAVA path
    - fixes #96
  * fix: better handle selenium started event (when roles are hub or node)
    - fixes #98
    - fixes #97

# 4.4.0 (2015-04-17)

  * upgrade chrome driver to [2.15](https://chromedriver.storage.googleapis.com/2.15/notes.txt)

# 4.3.0 (2015-04-17)

  * parse selenium's -hub argument to find the hub hostname

# 4.2.2 (2015-03-23)
  
  * fix selenium binary start

# 4.2.1 (2015-03-20)

  * FIX: flush stderr/stdout of selenium so that it does not fails

# 4.2.0 (2015-03-02)

  * upgrade to selenium 2.45.0

# 4.1.0 (2015-02-06)

  * update chrome driver to [2.14](http://chromedriver.storage.googleapis.com/2.14/notes.txt)

# 4.0.0 (2015-02-06)
  
  * cache downloads, see #68

# 3.3.0 (2015-02-03)

  * forward request error to install error, #64

# 3.2.0 (2015-01-23)

  * add --baseURL, --drivers.*.baseURL options, also in programmatic API

# 3.1.2 (2015-01-17)

  * try to force npm to publish

# 3.1.1 (2015-01-17)

  * fixes #60, programmatic `install` without a `progressCb`

# 3.1.0 (2015-01-17)
  
  * add `opts.logger` to `install()`, defaults to `noop`
  * add `opts.progressCb` to `install(opts)`, now you can receive progress information
  * log more info when installing: source, destination
  * show progress when installing
  * check for pathsexistence before starting and error accordingly
  * add `opts.spawnCb` to `start()`, now you can receive the spawned process asap
  * more tests
  * readme tweaks

# 3.0.3 (2015-01-10)
  
  * inform user that `start-selenium` is deprecated

# 3.0.2 (2015-01-10)

  * ie fix

# 3.0.1 (2015-01-10)
  
  * ie fix

# 3.0.0 (2015-01-10)
  
  * complete refactoring
  * command line is now named `selenium-standalone`
  * you must use `selenium-standalone install` and then `selenium-standalone start`
  * programmatic API changed too, `require('selenium-standalone').install(cb)` or `require('selenium-standalone').start(cb)`
  * using the programmatic API, you must kill the server yourself, the child_process is sent in the `start` callback: `cb(err, cp)`
  * you can now install and start different selenium versions and drivers versions

# 2.44.0-7 (2015-01-04)
  
  * fix start-selenium when port is not `4444`

# 2.44.0-6 (2015-01-03)

  * add tests on new `cb()` functionnality
  * backward compat for people not using a `cb`
  * lower down callback loop to 200ms

# 2.44.0-5 (2015-01-03)
  
  * fix start-selenium command line (missing callback)

# 2.44.0-4 (2015-01-02)
  
  * programmatic API now exposes a callback to inform when selenium has started

# 2.44.0-3 (2015-01-02)
  
  * update chromedriver to [2.13](http://chromedriver.storage.googleapis.com/2.13/notes.txt)

# 2.44.0-2 (2015-01-02)

  * initial history generation


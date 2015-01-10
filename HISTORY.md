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


### Start Selenium whenever your (ubuntu) machine starts!

After installing selenium-standalone globally, execute the following commands to run selenium-standalone when your machine starts!

```shell
ln -s /usr/local/bin/selenium-standalone /etc/init.d/
update-rc.d selenium-standalone defaults
```

For more information: https://stackoverflow.com/questions/3666794/selenium-server-on-startup/30392437#30392437

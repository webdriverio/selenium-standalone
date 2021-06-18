<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Running headlessly](#running-headlessly)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

### Running headlessly

On linux,

To run headlessly, you can use [xvfb](https://en.wikipedia.org/wiki/Xvfb):

```shell
xvfb-run --server-args="-screen 0, 1366x768x24" selenium-standalone start
```

### Running headlessly

On linux,

To run headlessly, you can use [xvfb](https://en.wikipedia.org/wiki/Xvfb):

```shell
xvfb-run --server-args="-screen 0, 1366x768x24" selenium-standalone start
```

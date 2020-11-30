### `Error: unable to get local issuer certificate`

This error might happen when you are behind a specific proxy. Then you need to set some environement variables:

```sh
NODE_TLS_REJECT_UNAUTHORIZED=0 selenium-standalone install`
NODE_TLS_REJECT_UNAUTHORIZED=0 selenium-standalone start
```

On Windows:

```setx NODE_TLS_REJECT_UNAUTHORIZED 0```

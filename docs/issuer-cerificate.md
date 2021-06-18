<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [`Error: unable to get local issuer certificate`](#error-unable-to-get-local-issuer-certificate)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

### `Error: unable to get local issuer certificate`

This error might happen when you are behind a specific proxy. Then you need to set some environement variables:

```sh
NODE_TLS_REJECT_UNAUTHORIZED=0 selenium-standalone install`
NODE_TLS_REJECT_UNAUTHORIZED=0 selenium-standalone start
```

On Windows:

```setx NODE_TLS_REJECT_UNAUTHORIZED 0```

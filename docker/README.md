# selenium-standalone server

selenium-standalone Server with Chrome and Firefox

## Dockerfile

[Dockerfile](./Dockerfile)

## Build image

```
docker build -t vvoyer/selenium-standalone . --rm
```

## Use image

```
$ docker run -it -p 4444:4444 vvoyer/selenium-standalone
```

### Parameters

* `SCREEN_GEOMETRY` Set browser window size
  * Format: `<WIDTH>x<HEIGHT>x<DEPTH>`
  * Default: `1024x768x16`
  * Usage example: set screen size to 1200x1200 with 8bits depth
    ```
    $ docker run -it -p 4444:4444 -e SCREEN_GEOMETRY="1200x1200x8" vvoyer/selenium-standalone
    ```

* `DEBUG` Enable selenium-standalone debug messages
  * Value: `selenium-standalone:*`
  * Default: `null`
  * Usage example: 
    * Enable debug when building the image
    ```
    $ docker build --build-arg DEBUG=selenium-standalone:* -t vvoyer/selenium-standalone . --rm
    ```
    * Enable debug when running the image
    ```
    $ docker run -it -p 4444:4444 -e DEBUG="selenium-standalone:*" vvoyer/selenium-standalone
    ```
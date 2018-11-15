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

### Healthcheck

A Docker [healthcheck](https://docs.docker.com/engine/reference/builder/#healthcheck) is defined when the image is built. 

This defines a _health_ status attached to the running container. It checks that Selenium server _ready_ status is true

#### Use cases

* Manually check the status of a running `vvoyer/selenium-standalone` container

  ```
  docker ps
  ```

  Check `STATUS` property, health status is displayed at the end (between parenthesis)

* When running the image in [`detached`](https://docs.docker.com/engine/reference/run/#detached--d) mode you want to      ensure that the Selenium server is ready before using it.

  Here is a way to poll check container health status until it's `healthy`:

  ```
  # Start container in detached mode, forcing its name to `sel-std`
  docker run --rm --name=sel-std -d -p 4444:4444 vvoyer/selenium-standalone

  # Will loop until container `sel-std` (you can also check via container id) health status is exactly `healthy`
  while ! docker inspect --format='{{json .State.Health}}' sel-std | grep -sq '"healthy"'; do sleep 1; done
  ```

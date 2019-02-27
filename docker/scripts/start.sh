#!/usr/bin/env bash

. /home/seluser/scripts/utils.sh && print_selenium_env

echo "Screen Geometry: ${SCREEN_GEOMETRY}"

sudo rm -f /tmp/.X*lock

xvfb-run -a --server-args="-screen 0 ${SCREEN_GEOMETRY} -ac +extension RANDR" \
    selenium-standalone start

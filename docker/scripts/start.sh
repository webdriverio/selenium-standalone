
echo "SCREEN_GEOMETRY: ${SCREEN_GEOMETRY}"

sudo rm -f /tmp/.X*lock

xvfb-run -a --server-args="-screen 0 ${SCREEN_GEOMETRY} -ac +extension RANDR" \
    selenium-standalone start

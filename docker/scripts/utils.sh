#!/bin/bash

print_selenium_env () {
    CHROME_VERSION=$(/usr/bin/google-chrome --version)
    FIREFOX_VERSION=$(/usr/bin/firefox --version)

    SS_CONFIG=$(npm root -g)/selenium-standalone/lib/default-config.js
    SELENIUM_SERVER=$(node -p -e "require('$SS_CONFIG').version")
    CHROME_WD_VERSION=$(node -p -e "require('$SS_CONFIG').drivers.chrome.version")
    FIREFOX_WD_VERSION=$(node -p -e "require('$SS_CONFIG').drivers.firefox.version")

    echo ""
    echo ""
    echo "Selenium environment:"
    echo ""
    echo "  * Browsers:"
    echo "    - ${CHROME_VERSION}"
    echo "    - ${FIREFOX_VERSION}"
    echo ""
    echo "  * Selenium:"
    echo "    - Server:            ${SELENIUM_SERVER}"
    echo "    - Chrome webdriver:  ${CHROME_WD_VERSION}"
    echo "    - Firefox webdriver: ${FIREFOX_WD_VERSION}"
    echo ""
    echo ""
}

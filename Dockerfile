FROM ubuntu:bionic

WORKDIR /usr/app

ENV NODE_VERSION 16.11.1
ENV NVM_DIR /usr/local/nvm

LABEL author="Vincent Voyer <vincent@zeroload.net>"
LABEL maintainer="Serban Ghita <serbanghita@gmail.com>"

ENV LC_ALL=C
ENV DEBIAN_FRONTEND=noninteractive
ENV DEBCONF_NONINTERACTIVE_SEEN=true

EXPOSE 4444

RUN apt-get -qqy update
RUN apt-get -qqy install \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common \
    sudo
RUN curl -sS -o - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list
RUN echo "deb http://archive.ubuntu.com/ubuntu bionic main universe\n" > /etc/apt/sources.list \
  && echo "deb http://archive.ubuntu.com/ubuntu bionic-updates main universe\n" >> /etc/apt/sources.list \
  && echo "deb http://security.ubuntu.com/ubuntu bionic-security main universe\n" >> /etc/apt/sources.list
RUN apt-get -qqy update


RUN groupadd --gid 1000 node \
  && useradd --uid 1000 --gid node --shell /bin/bash --create-home node
RUN echo 'node ALL=(ALL) NOPASSWD: ALL' >> /etc/sudoers

RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -

RUN \
  apt-get update && \
  DEBIAN_FRONTEND=noninteractive \
    apt-get -y install \
      default-jre-headless \
      firefox \
      google-chrome-stable \
      xvfb \
      xfonts-100dpi \
      xfonts-75dpi \
      xfonts-scalable \
      xfonts-cyrillic \
  && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

# RUN apt-get -qqy --no-install-recommends install \

RUN export DISPLAY=:99.0
RUN Xvfb :99 -shmem -screen 0 1366x768x16 &

# install nvm
# https://github.com/creationix/nvm#install-script
RUN mkdir -p $NVM_DIR
RUN curl --silent -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# install node and npm
RUN . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

# add node and npm to path so the commands are available
ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

WORKDIR /home/selenium-standalone
RUN npm init -y

COPY . .
RUN npm install --production


CMD DEBUG=selenium-standalone:* ./bin/selenium-standalone install && DEBUG=selenium-standalone:* ./bin/selenium-standalone start

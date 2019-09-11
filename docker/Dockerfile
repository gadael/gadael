FROM ubuntu:18.04

# Basic dependency
RUN apt-get update && apt-get install -y gnupg2 git g++ gyp gcc make curl
RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv E52529D4
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# Node config
ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 10.16.3

RUN curl --silent -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.2/install.sh | bash

RUN source $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

RUN npm install -g bower

# Pull App dependency
WORKDIR /app
COPY package.json package-lock.json /app/
COPY bower.json /app/
RUN cd /app && npm set progress=false && npm install

RUN bower install --allow-root

# Configure App
COPY .  /app
RUN mv config.docker.js config.js
CMD node /app/app.js
ENV NODE_ENV production
EXPOSE 3000

#!/bin/bash

# To create the build, requirements are: fpm, git, npm, bower

mkdir /tmp/gadael_build
cd /tmp/gadael_build || exit

# We need a gadael installation without dev dependencies

git clone https://github.com/gadael/gadael
cd gadael || exit
git checkout tags/$1

npm install --only=production
bower install

rm -Rf doc/ test/
mv config.dist.js config.js

cd /tmp/gadael_build || exit

# Build debian package

fpm -s dir -t deb -n gadael --config-files /etc/gadael/config.json -v $1 \
gadael=/var/lib/gadael \
gadael/dist/config.json=/etc/gadael/

rm -Rf gadael/

echo "Packages are in the /tmp/gadael_build folder"

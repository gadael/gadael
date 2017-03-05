#!/bin/bash

# To create the build, requirements are: fpm, git, npm, bower

mkdir /tmp/gadael_build
cd /tmp/gadael_build || exit

# We need a gadael installation without dev dependencies

git clone https://github.com/gadael/gadael
cd gadael || exit
git checkout tags/$1 || exit

npm install --production --loglevel warn
bower install

rm -Rf doc/ test/
mv config.dist.js config.js


# Build debian package

fpm -s dir -t deb -p ../ -n gadael --config-files /etc/gadael/config.json -v $1 ./=/var/lib/gadael dist/config.json=/etc/gadael/



# rm -Rf gadael/

echo "Packages are in the /tmp/gadael_build folder"

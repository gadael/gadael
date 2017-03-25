#!/bin/bash

if [ -z $1 ]; then
    echo "the parameter is missing (git version tag)";
    exit;
fi

# To create the build, requirements are: fpm, git, npm, bower, rpmbuild

rm -Rf /tmp/gadael_build
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

fpm -s dir -t deb -p ../ -n gadael \
    --config-files /etc/gadael/config.json \
    -v $1 \
    -d "mongodb > 2.4.14" \
    -d "nodejs-legacy > 4.2.0" \
    ./=/var/lib/gadael dist/config.json=/etc/gadael/ dist/gadael.service=/etc/systemd/system/

# Build rpm package

fpm -s dir -t rpm -p ../ -n gadael \
    --config-files /etc/gadael/config.json \
    -v $1 \
    -d "mongodb-org > 2.4.14" \
    -d "nodejs > 4.2.0" \
    ./=/var/lib/gadael dist/config.json=/etc/gadael/ dist/gadael.service=/etc/systemd/system/

cd ..
rm -Rf gadael/

echo "Packages are in the /tmp/gadael_build folder"

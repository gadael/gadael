'use strict';

const screenServer = require('./screenServer');

const site = require('./site');

let language='fr';
let country='FR';
if (undefined !== process.argv[2]) {
    language = process.argv[2];
}

if ('en' === language) {
    country = 'UK';
}

Promise.all([
    screenServer('docScreenshots_'+language, country, language),
    site(language)
])
.catch(err => {
    console.log(err.stack);
});

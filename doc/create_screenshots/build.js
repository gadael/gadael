'use strict';

const helpers = require('./screenServer');
const pages = require('./pages');
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
    helpers.screenServer('docScreenshots_'+language, country, language, pages),
    site(language)
])
.catch(err => {
    console.log(err.stack);
});

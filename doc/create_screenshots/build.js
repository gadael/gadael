'use strict';

const helpers = require('./screenServer');
const pages = require('./pages');

let language='fr';
let country='FR';
if (undefined !== process.argv[2]) {
    language = process.argv[2];
}

if ('en' === language) {
    country = 'UK';
}

helpers.screenServer('docScreenshots_'+language, country, language, pages);

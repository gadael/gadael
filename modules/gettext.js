'use strict';

/**
 * a gettext instance
 *
 */

const Gettext = require("node-gettext");
const gettextParser = require("gettext-parser");
const fs = require("fs");



exports = module.exports = function(config) {
    let gt = new Gettext();

    function addTranslation(language) {
        let mo = gettextParser.mo.parse(fs.readFileSync('./po/server/'+language+'.mo'));
        gt.addTranslations(language, 'messages', mo);
    }

    addTranslation('fr');

    gt.setLocale(config.language);

    // Add date formating capability

    function pad(num) {
        let s = '00' + num;
        return s.substr(s.length-2);
    }

    gt.getLocalDateString = function(dt) {
        if ('fr' === config.language) {
            return pad(dt.getDate()) +'/'+ pad(dt.getMonth() + 1) +'/'+ dt.getFullYear();
        }

        return pad(dt.getMonth() + 1) + "/" + pad(dt.getDate()) + "/" + dt.getFullYear();
    };

    gt.getLocalDateTimeString = function(dt) {
        return gt.getLocalDateString(dt)+' '+pad(dt.getHours())+':'+pad(dt.getMinutes());
    };

    if (config.language !== 'en') {
        gt.on('error', error => console.log(error));
    }

    return gt;
};

'use strict';

/**
 * a gettext instance
 *
 */

var Gettext = require("node-gettext");

exports = module.exports = function(config) {
    let gt = new Gettext();

    if ('fr' === config.language) {
        gt.addTextdomain("fr", require("fs").readFileSync('./po/server/fr.mo'));
    }

    gt.textdomain(config.language);

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

    return gt;
};

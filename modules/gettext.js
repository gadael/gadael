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

    return gt;
};

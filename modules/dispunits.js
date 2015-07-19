'use strict';

/**
 * Get a label for display unit
 * @param {string} unit
 * @param {Number} [quantity]
 */
exports = module.exports = function(unit, quantity) {

    if (undefined === quantity || null === quantity) {
        quantity = 10;
    }

    var Gettext = require('node-gettext');
    var gt = new Gettext();

    switch(unit) {
        case 'D':
            return gt.ngettext('Day', 'Days', quantity);
        case 'H':
            return gt.ngettext('Hour', 'Hours', quantity);
    }

};

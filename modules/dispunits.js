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

    var gt = require('./gettext');

    switch(unit) {
        case 'D':
            return gt.ngettext('day', 'days', quantity);
        case 'H':
            return gt.ngettext('hour', 'hours', quantity);
    }

};

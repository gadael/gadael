'use strict';

/**
 * Get a label for display unit
 * @param {string} unit
 * @param {Number} [quantity]
 */
exports = module.exports = function(app) {

    const gt = app.utility.gettext;

    return function(unit, quantity) {

        if (undefined === quantity || null === quantity) {
            quantity = 10;
        }

        switch(unit) {
            case 'D':
                return gt.ngettext('day', 'days', quantity);
            case 'H':
                return gt.ngettext('hour', 'hours', quantity);
        }

    };
};

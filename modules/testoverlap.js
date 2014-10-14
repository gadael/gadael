'use strict';

/**
 * Test if two periods do not overlap
 * in each periods, the start date is mandatory and the finish date in optional
 *
 * @param   {Object}  period1 A period with from and to properties
 * @param   {Object}  period2 A period with from and to properties
 * @returns {Boolean} return false if the two periods operlap
 */
exports = module.exports = function(period1, period2) {
    if (period2.to && period1.to) {
        if (period1.to > period2.from && period1.from < period2.to) {
            // the current period overlap one of the existing periods
            return false;
        }
        return true;
    }


    if (!period2.to && period1.to > period2.from) {
        // the current infinite period overlap one of the existing periods
        return false;
    }


    if (!period1.to && period1.from < period2.to) {
        // the current period overlap the end infinite period
        return false;
    }

    return true;
};

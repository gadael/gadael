'use strict';

const SpecialRight = require('./specialright');
const util = require('util');

/**
 * Right for "reduction du temps de travail"
 *
 * @constructor
 * @augments specialright
 *
 *
 */
function Rtt(app) {
    SpecialRight.call(this, app);

    this.editQuantity = false;

    this.countries = ['FR'];
}


Rtt.prototype = Object.create(SpecialRight.prototype);
Rtt.prototype.constructor = Rtt;


Rtt.prototype.getName = function() {
    const gt = this.app.utility.gettext;
    return gt.gettext('RTT');
};


Rtt.prototype.getDescription = function() {
    const gt = this.app.utility.gettext;
    return gt.gettext('Working time reduction right, this right require an annual leave with same renewal period');
};


/**
 * Get initial quantity used by renewals
 * @param {RightRenewal} renewal
 * @return {Promise}
 */
Rtt.prototype.getQuantity = function(renewal, user) {

    const gt = this.app.utility.gettext;

    return user.getAccount()
    .then(account => {

        return Promise.all([
        //    account.getWeekHours(renewal.start, renewal.finish),
            renewal.getPlannedWorkDayNumber(user), // without week-ends, annual leaves and non working days
            account.getIntersectCollection(renewal.start, renewal.finish) // collection on period start
        ]);
    })
    .then(all => {

        if (null === all[1]) {
            // TODO: return 0 instead of error message if getIntersectCollection work correctly
            throw new Error(util.format(gt.gettext('No collection found on the renewal period from %s to %s'), renewal.start, renewal.finish));
        }

        // all[0] number of potential worked days in the renewal of the annual leave
        // all[1].workedDays agreement worked days

        if (undefined === all[1].workedDays) {
            throw new Error(gt.gettext('The collection does not contain the number of days from the collective agreement'));
        }

        return Math.abs(all[0] - all[1].workedDays);
    });

};


Rtt.prototype.getQuantityLabel = function() {
    const gt = this.app.utility.gettext;
    return gt.gettext('RTT is computed from the user time schedule on the renewal period');
};


exports = module.exports = Rtt;

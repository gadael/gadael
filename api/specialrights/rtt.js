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
    return gt.gettext('Working time reduction right, this right require an annual leave right overlapping the renewal period');
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
            renewal.getPlannedWorkDayNumber(user), // without week-ends, annual leaves and non working days
            account.getIntersectCollection(renewal.start, renewal.finish), // collection on period start
            account.getWeekHours(renewal.start, renewal.finish)
        ]);
    })
    .then(all => {

        if (35 >= all[2].hours) {
            throw new Error(gt.gettext('Less than 35 hours per week of work where found on the renewal period'));
        }

        if (null === all[1]) {
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


/**
 * Get additional stats to display for special right
 * @return {Promise}
 */
SpecialRight.prototype.getStats = function(renewal, user) {

    const gt = this.app.utility.gettext;

    return user.getAccount()
    .then(account => {

        return Promise.all([
            renewal.getWeekEndDays(account),
            renewal.getNonWorkingDayQuantity(account),
            renewal.getPaidLeavesQuantity(user)
        ]);

    }).then(r => {

        const weekEnds = r[0];
        const nonWorkingDays = r[1];
        const initalQuantity = r[2];

        return [
            {
                name: gt.gettext('Annual leaves'),
                value: initalQuantity+' '+gt.gettext('days')
            },
            {
                name: gt.gettext('Week-ends'),
                value: weekEnds+' '+gt.gettext('days')
            },
            {
                name: gt.gettext('Non working days'),
                value: nonWorkingDays+' '+gt.gettext('days')
            }
        ];
    });


};

exports = module.exports = Rtt;

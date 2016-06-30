'use strict';

const SpecialRight = require('./specialright');
const gt = require('./../../modules/gettext');

/**
 * Right for "reduction du temps de travail"
 *
 * @constructor
 * @augments specialright
 *
 *
 */
function Rtt() {
    SpecialRight.call(this);

    this.editQuantity = false;

    this.countries = ['FR'];
}


Rtt.prototype = Object.create(SpecialRight.prototype);
Rtt.prototype.constructor = Rtt;


Rtt.prototype.getName = function() {
    return gt.gettext('RTT');
};


Rtt.prototype.getDescription = function() {
    return gt.gettext('Working time reduction right, this right require an annual leave with same renewal period');
};


/**
 * Get initial quantity used by renewals
 * @param {RightRenewal} renewal
 * @return {Promise}
 */
Rtt.prototype.getQuantity = function(renewal, user) {

    /*
    Vos salariés travaillent 37,5 heures par semaine sur 5 jours, soit 37,5 / 5 = 7,5 par jour.
    Dans l’année, ils travaillent :
    365 – 104 jours de repos hebdomadaires (week-ends) – 25 jours de congés payés – 8 jours fériés chômés = 228 jours.
    Ces 228 jours représentent 228 / 5 (jours par semaine) = 45,6 semaines de travail.
    Vos salariés effectuent donc (37,5 – 35) x 45,6 = 114 heures de travail « en trop » pour être réellement à 35 heures par semaine.
    Or, ces 114 heures représentent 114 / 7,5 = 15,2 jours de RTT dans l’année (à arrondir, en fonction de l’accord, à la journée ou à la demi-journée supérieure).
    */



    return user.getAccount()
    .then(account => {

        return Promise.all([
        //    account.getWeekHours(renewal.start, renewal.finish),
            renewal.getPlannedWorkDayNumber(user), // 25 days
            account.getCollection(renewal.start) // collection on period start
        ]);
    })
    .then(all => {

        // all[0] number of potential worked days in the renewal of the annual leave
        // all[1].workedDays agreement worked days

        if (undefined !== all[1].workedDays) {
            return (all[0] - all[1].workedDays);
        }

        throw new Error('missing workdays on collection');
    });

};


Rtt.prototype.getQuantityLabel = function() {
    return gt.gettext('RTT is computed from the user time schedule on the renewal period');
};


exports = module.exports = Rtt;

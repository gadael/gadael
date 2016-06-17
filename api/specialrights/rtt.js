'use strict';

const specialright = require('./specialright');
const gt = require('./../modules/gettext');

/**
 * Right for "reduction du temps de travail"
 *
 * @constructor
 * @augments specialright
 *
 *
 */
function rtt() {
    this.base();

    this.quantityReadOnly = true;

    this.countries = ['FR'];
}


rtt.prototype = new specialright();


rtt.prototype.getName = function() {
    return gt.gettext('RTT');
};


rtt.prototype.getDescription = function() {
    return gt.gettext('Working time reduction right, this right require an annual leave with same renewal period');
};


/**
 * Get initial quantity used by renewals
 * @param {RightRenewal} renewal
 */
rtt.prototype.getQuantity = function(renewal, user) {


    /*
    Vos salariés travaillent 37,5 heures par semaine sur 5 jours, soit 37,5 / 5 = 7,5 par jour.
    Dans l’année, ils travaillent :
    365 – 104 jours de repos hebdomadaires (week-ends) – 25 jours de congés payés – 8 jours fériés chômés = 228 jours.
    Ces 228 jours représentent 228 / 5 (jours par semaine) = 45,6 semaines de travail.
    Vos salariés effectuent donc (37,5 – 35) x 45,6 = 114 heures de travail « en trop » pour être réellement à 35 heures par semaine.
    Or, ces 114 heures représentent 114 / 7,5 = 15,2 jours de RTT dans l’année (à arrondir, en fonction de l’accord, à la journée ou à la demi-journée supérieure).
    */


    let rightModel = renewal.model('Right');

    // find a renewal for annual leave matching the RTT renewal


    return rightModel.findOne()
    .where('special').is('annualleave')
    .exec()
    .then(right => {

        if (null === right) {
            throw new Error('To compute RTT quantity, an annual leave right is required');
        }

        return right.getSameRenewal(renewal.start, renewal.finish);

    })
    .then(annualLeaveRenewal => {

        if (null === annualLeaveRenewal) {
            throw new Error('To compute RTT quantity, an annual leave right with same renewal period is required');
        }

        return user.getAccount()
        .then(account => {
            return Promise.all([
                account.getWeekHours(renewal.start, renewal.finish),
                annualLeaveRenewal.getPlannedWorkDayNumber(user)
            ]);
        });

    })
    .then(all => {

        // all[0].days number of days in one week
        // all[0].hours number of hours in one week
        // all[1] number of potential worked days in the renewal of the annual leave

        let dayHours = all[0].hours / all[0].days;
        let workWeeks = all[1] / all[0].days;

        let exceedingHours = (all[0].hours - 35) * workWeeks;
        let exceedingDays = exceedingHours / dayHours;

        return Math.round(exceedingDays);
    });

};


rtt.prototype.getQuantityLabel = function() {
    return gt.gettext('RTT is computed from the user time schedule on the renewal period');
};


exports = module.exports = rtt;

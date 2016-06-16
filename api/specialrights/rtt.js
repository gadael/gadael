'use strict';

const specialright = require('./specialright');
const gt = require('./../modules/gettext');

/**
 * Right for "reduction du temps de travail"
 *
 * @constructor
 * @augments specialright
 *
 * @param {Express} app
 */
function rtt(app) {
    this.base(app);

    this.quantityReadOnly = true;

    this.countries = ['FR'];
}


rtt.prototype = new specialright();


rtt.prototype.getDescription = function() {
    return gt.gettext('RTT, working time reduction right');
};


/**
 * Get initial quantity used by renewals
 * @param {RightRenewal} renewal
 */
rtt.prototype.getQuantity = function(renewal, user) {
    // TODO

    /*
    Vos salariés travaillent 37,5 heures par semaine sur 5 jours, soit 37,5 / 5 = 7,5 par jour.
    Dans l’année, ils travaillent :
    365 – 104 jours de repos hebdomadaires (week-ends) – 25 jours de congés payés – 8 jours fériés chômés = 228 jours.
    Ces 228 jours représentent 228 / 5 (jours par semaine) = 45,6 semaines de travail.
    Vos salariés effectuent donc (37,5 – 35) x 45,6 = 114 heures de travail « en trop » pour être réellement à 35 heures par semaine.
    Or, ces 114 heures représentent 114 / 7,5 = 15,2 jours de RTT dans l’année (à arrondir, en fonction de l’accord, à la journée ou à la demi-journée supérieure).
    */

    user.getAccount()
    .then(account => {

        return Promise.all([
            account.getWeekHours(),
            renewal.getPlannedWorkDayNumber(user)
        ]);
    })
    .then(all => {

        // TODO: days per week
        //


    });


    return 0;
};


rtt.prototype.getQuantityLabel = function() {
    return gt.gettext('RTT is computed from the user time schedule on the renewal period');
};


exports = module.exports = rtt;

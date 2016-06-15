'use strict';

let specialright = require('./specialright');

/**
 * Right for "reduction du temps de travail"
 * @param {Express} app
 */
function rtt(app) {
    this.base(app);

}


rtt.prototype = new specialright();


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


exports = module.exports = rtt;

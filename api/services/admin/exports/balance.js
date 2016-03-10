'use strict';


let Gettext = require('node-gettext');
let gt = new Gettext();


/**
 * Export leave rights on a date
 * @param {apiService} service
 * @param {Date}       moment
 * @return {Promise}           Promised data is the array compatible with xlsx-writestream
 */
exports = module.exports = function(service, moment) {


    const NAME              = gt.gettext('Name');
    const DEPARTMENT        = gt.gettext('Department');
    const RIGHT             = gt.gettext('Right');
    const RENEWAL_START     = gt.gettext('Renewal start');
    const RENEWAL_FINISH    = gt.gettext('Renewal finish');
    const QUANTITY          = gt.gettext('Quantity'); // initial quantity with adjustments
    const CONSUMED          = gt.gettext('Consumed quantity');
    const BALANCE           = gt.gettext('Remaining quantity');

    return new Promise((resolve, reject) => {


    });
};

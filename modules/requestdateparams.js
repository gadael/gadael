'use strict';


/**
 * verification for services parameters with a period for an absence request
 */









/**
 * Verify the parameters validity
 * @param   {listItemsService} service
 * @param   {Object}           params  Query parameters
 * @returns {Boolean}
 */
exports = module.exports = function(app) {

    const gt = app.utility.gettext;

    return function checkParams(service, params) {

        if (!params.dtstart || !params.dtend) {
            service.forbidden(gt.gettext('dtstart, dtend are mandatory parameters'));
            return false;
        }

        params.dtstart = new Date(params.dtstart);
        params.dtend = new Date(params.dtend);


        var diff = Math.abs(params.dtend - params.dtstart);

        if (diff <= 0) {
            service.forbidden(gt.gettext('dtend must be greater than dtstart'));
            return false;
        }

        if (((diff/3600000)/24/365) > 2) {
            service.forbidden(gt.gettext('Dates interval must be less than 2 years'));
            return false;
        }

        return true;
    };

};

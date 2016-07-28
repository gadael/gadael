'use strict';


const gt = require('./../../../../modules/gettext');
const gcal = require('google-calendar');



function isWritable(calendar) {
    if ('owner' === calendar.accessRole) {
        return true;
    }

    return false;
}




/**
 * Create the service
 * @param   {Object} services
 * @param   {Object} app
 * @returns {listItemsService}
 */
exports = module.exports = function(services, app) {

    var service = new services.list(app);


    /**
     * Call the googlecalendars list service
     * Get the list of writable calendars, using the connected google account
     *
     *
     *
     * @param {Object} params
     *
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        if (!params.user.google || !params.user.google.accessToken) {
            service.forbidden(gt.gettext('Not connected to a google calendar'));
            return service.deferred.promise;
        }

        let google_calendar = new gcal.GoogleCalendar(params.user.google.accessToken);

        google_calendar.calendarList.list(function(err, data) {
            if(err) {
                return service.error(err);
            }

            service.outcome.success = true;
            service.deferred.resolve(data.items.filter(isWritable));
        });

        return service.deferred.promise;
    };


    return service;
};





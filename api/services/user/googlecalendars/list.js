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

    let service = new services.list(app);

    let retry = 3;

    function getUserResponse(user) {


        function errorToAlerts(err) {
            if (undefined !== err.errors) {
                err.errors.forEach(gErr => {
                    service.addAlert('danger', gErr.message);
                });
            } else {
                service.addAlert('danger', err.message);
            }
        }


        function reject(err) {
            service.httpstatus = 500;
            service.outcome.success = false;
            service.deferred.reject(err.message);
        }


        function googleResponse(err, data) {
            if(err) {

                retry--;
                errorToAlerts(err);


                if (401 === err.code && retry > 0) {
                    // access token token expired, refresh done less than 2 times
                    user.refreshGoogleAccessToken()
                    .then(getUserResponse)
                    .catch(err => {
                        errorToAlerts(err);
                        reject(err);
                    });
                    return;
                }

                return reject(err);
            }

            service.outcome.success = true;
            service.deferred.resolve(data.items.filter(isWritable));
        }

        let google_calendar = new gcal.GoogleCalendar(user.google.accessToken);
        google_calendar.calendarList.list(googleResponse);
    }





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

        getUserResponse(params.user);

        return service.deferred.promise;
    };


    return service;
};





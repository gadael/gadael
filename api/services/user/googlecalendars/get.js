'use strict';

const gcal = require('google-calendar');
const gcalResponse = require('./../../../../modules/gcalResponse');


exports = module.exports = function(services, app) {


    let service = new services.get(app);

    const gt = app.utility.gettext;


    /**
     * Call googlecalendars get service
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        function getUserResponse(user) {

            let googleResponse = gcalResponse(service, getUserResponse, user, function(data) {
                service.outcome.success = true;
                service.deferred.resolve(data);
            });


            let google_calendar = new gcal.GoogleCalendar(user.google.accessToken);
            google_calendar.calendarList.get(params.id, googleResponse);
        }

        if (!params.user.google || !params.user.google.accessToken) {
            service.forbidden(gt.gettext('Not connected to a google calendar'));
            return service.deferred.promise;
        }

        getUserResponse(params.user);

        return service.deferred.promise;
    };


    return service;
};

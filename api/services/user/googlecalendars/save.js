'use strict';

const gcal = require('google-calendar');
const gcalResponse = require('./../../../../modules/gcalResponse');


/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {

    if (service.needRequiredFields(params, ['summary'])) {
        return;
    }

    saveCalendar(service, params);
}






function saveCalendar(service, params) {

    const gt = service.app.utility.gettext;

    function getUserResponse(user) {

        let googleResponse = gcalResponse(service, getUserResponse, user, function(data) {
            service.resolveSuccess(data, gt.gettext('A secondary calendar has been created'));
        });


        let google_calendar = new gcal.GoogleCalendar(user.google.accessToken);
        google_calendar.calendars.insert({
            summary: params.summary,
            description: gt.gettext('Leave periods provided by gadael')
        }, googleResponse);
    }

    getUserResponse(params.user);
}




/**
 * Construct the google caledendars create service (update is not supported for now)
 * @param   {object}          services list of base classes from apiService
 * @param   {express|object}  app      express or headless app
 * @returns {saveItemService}
 */
exports = module.exports = function(services, app) {

    var service = new services.save(app);

    /**
     * Call the adjustments save service
     *
     * @param {Object} params
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        validate(service, params);
        return service.deferred.promise;
    };


    return service;
};

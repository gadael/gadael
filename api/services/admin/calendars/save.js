'use strict';


/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {

    if (service.needRequiredFields(params, ['name'])) {
        return;
    }

    saveCalendar(service, params);
}


/**
 * Update/create the calendar document
 *
 * @param {apiService} service
 * @param {Object} params
 */
function saveCalendar(service, params) {


    const CalendarModel = service.app.db.models.Calendar;

    const gt = service.app.utility.gettext;


    var fieldsToSet = {
        name: params.name,
        url: params.url,
        type: params.type,
        lastUpdate: new Date()
    };

    if ('workschedule' === params.type) {
        fieldsToSet.halfDayHour = params.halfDayHour;
        fieldsToSet.hoursPerDay = params.hoursPerDay;
    }


    function downloadEvents(calendar, message)
    {
        calendar.downloadEvents().then(function() {
            service.resolveSuccessGet(
                calendar._id,
                message
            );
        }).catch(function(err) {

            service.forbidden(err);
        });

    }


    if (params.id)
    {
        CalendarModel.findOne({ _id: params.id }, function(err, calendar) {

            if (service.handleMongoError(err)) {
                if (calendar.locked) {
                    return service.forbidden(gt.gettext('The calendar is locked'));
                }

                calendar.set(fieldsToSet);

                if ('workschedule' !== calendar.type) {
                    calendar.halfDayHour = undefined;
                    calendar.hoursPerDay = undefined;
                }

                calendar.save(function(err, calendar) {
                    if (service.handleMongoError(err)) {
                        downloadEvents(calendar, gt.gettext('The calendar has been modified'));
                    }
                });
            }
        });

    } else {

        let calendar = new CalendarModel();
        calendar.set(fieldsToSet);

        calendar.save((err, calendar) => {

            if (service.handleMongoError(err)) {
                downloadEvents(calendar, gt.gettext('The calendar has been created'));
            }
        });
    }
}










/**
 * Construct the calendar save service
 * @param   {object}          services list of base classes from apiService
 * @param   {express|object}  app      express or headless app
 * @returns {saveItemService}
 */
exports = module.exports = function(services, app) {

    var service = new services.save(app);

    /**
     * Call the calendar save service
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

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
    
    var CalendarModel = service.models.Calendar;
    
    
    var fieldsToSet = { 
        name: params.name, 
        url: params.url,
        type: params.type,
        lastUpdate: new Date()  
    };
    
    
    
    

    if (params.id)
    {
        CalendarModel.findByIdAndUpdate(params.id, fieldsToSet, function(err, calendar) {
            if (service.handleMongoError(err))
            {
                calendar.downloadEvents();

                service.resolveSuccess(
                    calendar, 
                    service.gt.gettext('The calendar has been modified')
                );
            }
        });

    } else {

        CalendarModel.create(fieldsToSet, function(err, calendar) {

            if (service.handleMongoError(err))
            {
                service.resolveSuccess(
                    calendar, 
                    service.gt.gettext('The calendar has been created')
                );
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
    service.call = function(params) {
        validate(service, params);
        return service.deferred.promise;
    };
    
    
    return service;
};



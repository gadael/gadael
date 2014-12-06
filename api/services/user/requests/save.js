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

    saveRequest(service, params);
}
    
    
/**
 * Update/create the request document
 * 
 * @param {apiService} service
 * @param {Object} params
 */  
function saveRequest(service, params) {
    
    var RequestModel = service.models.Request;
    
    
    var fieldsToSet = { 
        user: params.user
    };
    
    if (undefined !== params.absence) {
        fieldsToSet.absence = params.absence;
    } else if (undefined !== params.time_saving_deposit) {
        fieldsToSet.time_saving_deposit = params.time_saving_deposit;
    } else if (undefined !== params.workperiod_recover) {
        fieldsToSet.workperiod_recover = params.workperiod_recover;
    }
    
    
    var filter = {
        _id: params.id,
        deleted: false
    };

    if (params.user) {
        filter['user.id'] = params.user;
    }
    

    if (params.id)
    {
        RequestModel.findOneAndUpdate(filter, fieldsToSet, function(err, document) {
            if (service.handleMongoError(err))
            {
                service.resolveSuccess(
                    document, 
                    service.gt.gettext('The request has been modified')
                );
            }
        });

    } else {
        
        fieldsToSet.createdBy = params.createdBy;

        RequestModel.create(fieldsToSet, function(err, document) {

            if (service.handleMongoError(err))
            {
                service.resolveSuccess(
                    document, 
                    service.gt.gettext('The request has been created')
                );
            }
        });
    }
}
    
    

    
    
    
    



/**
 * Construct the type save service
 * @param   {object}          services list of base classes from apiService
 * @param   {express|object}  app      express or headless app
 * @returns {saveItemService}
 */
exports = module.exports = function(services, app) {
    
    var service = new services.save(app);
    
    /**
     * Call the right type save service
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



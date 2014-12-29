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

    saveRightType(service, params);
}
    
    
/**
 * Update/create the right type document
 * 
 * @param {apiService} service
 * @param {Object} params
 */  
function saveRightType(service, params) {
    
    var TypeModel = service.app.db.models.Type;
    
    
    var fieldsToSet = { 
        name: params.name,
        group: params.group
    };
    

    if (params.id)
    {
        TypeModel.findByIdAndUpdate(params.id, fieldsToSet, function(err, document) {
            if (service.handleMongoError(err))
            {
                service.resolveSuccess(
                    document, 
                    service.gt.gettext('The right type has been modified')
                );
            }
        });

    } else {

        TypeModel.create(fieldsToSet, function(err, document) {

            if (service.handleMongoError(err))
            {
                service.resolveSuccess(
                    document, 
                    service.gt.gettext('The right type has been created')
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
    service.getResultPromise = function(params) {
        validate(service, params);
        return service.deferred.promise;
    };
    
    
    return service;
};



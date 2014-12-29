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

    saveRight(service, params);
}
    
    
/**
 * Update/create the vacation right document
 * 
 * @param {apiService} service
 * @param {Object} params
 */  
function saveRight(service, params) {
    
    var RightModel = service.app.db.models.Right;
    
    
    var fieldsToSet = { 
        name: params.name,
        description: params.description,
        type: params.type._id,
        require_approval: params.require_approval,
        quantity: params.quantity,
        quantity_unit: params.quantity_unit  
    };
    

    if (params.id)
    {
        RightModel.findByIdAndUpdate(params.id, fieldsToSet, function(err, document) {
            if (service.handleMongoError(err))
            {
                service.resolveSuccess(
                    document, 
                    service.gt.gettext('The vacation right has been modified')
                );
            }
        });

    } else {

        RightModel.create(fieldsToSet, function(err, document) {

            if (service.handleMongoError(err))
            {
                service.resolveSuccess(
                    document, 
                    service.gt.gettext('The vacation right has been created')
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
    service.getResultPromise = function(params) {
        validate(service, params);
        return service.deferred.promise;
    };
    
    
    return service;
};



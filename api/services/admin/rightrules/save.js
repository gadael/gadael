'use strict';



/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {

    if (service.needRequiredFields(params, ['title', 'type'])) {
        return;
    }

    saveRule(service, params);
}
    
    
/**
 * Update/create the calendar document
 * 
 * @param {apiService} service
 * @param {Object} params
 */  
function saveRule(service, params) {
    
    var RightRuleModel = service.models.RightRule;
    
    
    var fieldsToSet = { 
        right: params.right, 
        title: params.title,
        quantity: params.quantity,
        type: params.type,
        interval: params.interval,
        lastUpdate: new Date()  
    };
    
    
    
    

    if (params.id)
    {
        RightRuleModel.findByIdAndUpdate(params.id, fieldsToSet, function(err, document) {
            if (service.handleMongoError(err))
            {
                service.resolveSuccess(
                    document, 
                    service.gt.gettext('The right rule has been modified')
                );
            }
        });

    } else {

        RightRuleModel.create(fieldsToSet, function(err, document) {

            if (service.handleMongoError(err))
            {
                service.resolveSuccess(
                    document, 
                    service.gt.gettext('The right rule period has been created')
                );
            }
        });
    }
}
    
    

    
    
    
    



/**
 * Construct the right rule save service
 * @param   {object}          services list of base classes from apiService
 * @param   {express|object}  app      express or headless app
 * @returns {saveItemService}
 */
exports = module.exports = function(services, app) {
    
    var service = new services.save(app);
    
    /**
     * Call the right rule save service
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



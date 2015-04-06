'use strict';



/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {

    if (service.needRequiredFields(params, ['name', 'quantity_unit'])) {
        return;
    }

    // quantity is not required as not empty but must be defined to Number value, can be 0
    if (undefined === params.quantity) {
        service.deferred.reject(new Error('quantity must be defined'));
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

    var Gettext = require('node-gettext');
    var gt = new Gettext();
    
    var RightModel = service.app.db.models.Right;
    
    var type;
    if (undefined !== params.type) {
        type = params.type._id;
    }

    
    var fieldsToSet = { 
        name: params.name,
        description: params.description,
        type: type,
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
                    gt.gettext('The vacation right has been modified')
                );
            }
        });

    } else {

        RightModel.create(fieldsToSet, function(err, document) {

            if (service.handleMongoError(err))
            {
                service.resolveSuccess(
                    document, 
                    gt.gettext('The vacation right has been created')
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



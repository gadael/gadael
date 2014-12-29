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

    saveCollection(service, params);
}
    
    
/**
 * Update/create the collection document
 * 
 * @param {apiService} service
 * @param {Object} params
 */  
function saveCollection(service, params) {
    
    var RightCollection = service.app.db.models.RightCollection;

    if (params.id)
    {
        RightCollection.findById(params.id, function (err, document) {
            if (service.handleMongoError(err))
            {
                document.name 	= params.name;
                
                document.save(function (err) {
                    if (service.handleMongoError(err)) {
                        
                        service.resolveSuccess(
                            document, 
                            service.gt.gettext('The collection has been modified')
                        );
                    }
                });
            }
        });

    } else {

        RightCollection.create({
            name: params.name
        }, function(err, document) {

            if (service.handleMongoError(err))
            {
                service.resolveSuccess(
                    document, 
                    service.gt.gettext('The collection has been created')
                );
            }
        });
    }
}
    



exports = module.exports = function(services, app) {
    
    var service = new services.save(app);
    
    /**
     * Call the collection save service
     * 
     * @param {Object} params
     *
     * @return {Query}
     */
    service.getResultPromise = function(params) {
        validate(service, params);
        return service.deferred.promise;
    };
    
    
    return service;
};



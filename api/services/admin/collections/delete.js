'use strict';


exports = module.exports = function(services, app) {
    
    var service = new services.delete(app);
    
    /**
     * Call the collection delete service
     * 
     * @param {object} params
     * @return {Promise}
     */
    service.call = function(params) {
        
        
        service.models.RightCollection.findById(params.id, function (err, document) {
            if (service.handleMongoError(err)) {
                document.remove(function(err) {
                    if (service.handleMongoError(err)) {
                        service.success(service.gt.gettext('The collection has been deleted'));
                        
                        var rightCollection = document.toObject();
                        rightCollection.$outcome = service.outcome;
                        
                        service.deferred.resolve(rightCollection);
                    }
                });
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};


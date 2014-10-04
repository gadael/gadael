'use strict';


exports = module.exports = function(services, app) {
    
    var service = new services.delete(app);
    
    /**
     * Call the collection delete service
     * 
     * @param {int} id      Document mongoose ID
     * @return {Promise}
     */
    service.call = function(id) {
        
        
        service.models.RightCollection.findById(id, function (err, document) {
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


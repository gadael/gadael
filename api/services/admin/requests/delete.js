'use strict';


exports = module.exports = function(services, app) {
    
    var service = new services.delete(app);
    
    /**
     * Call the requests delete service
     * 
     * @param {int} id      Document mongoose ID
     * @return {Promise}
     */
    service.call = function(id) {
        
        
        service.models.Request.findById(id, function (err, document) {
            if (service.handleMongoError(err)) {
                
                document.deleted = true;
                document.save(function(err) {
                    if (service.handleMongoError(err)) {
                        service.success(service.gt.gettext('The request has been deleted'));
                        
                        var request = document.toObject();
                        request.$outcome = service.outcome;
                        
                        service.deferred.resolve(request);
                    }
                });
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};


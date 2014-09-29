'use strict';


exports = module.exports = function(services, app) {
    
    var service = new services.delete(app);
    
    /**
     * Call the users get service
     * 
     * @param {Object} params
     * @return {Promise}
     */
    service.call = function(id) {
        
        
        service.models.User.findById(id, function (err, document) {
            if (service.handleMongoError(err)) {
                document.remove(function(err) {
                    if (service.handleMongoError(err)) {
                        service.success(service.gt.gettext('The user has been deleted'));
                        
                        var user = document.toObject();
                        user.$outcome = service.outcome;
                        
                        service.deferred.resolve(user);
                    }
                });
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};


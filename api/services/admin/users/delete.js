'use strict';


exports = module.exports = function(services, app) {
    
    var service = new services.delete(app);
    
    /**
     * Call the users delete service
     * 
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        
        service.app.db.models.User.findById(params.id, function (err, document) {
            if (service.handleMongoError(err)) {
                
                if (null === document) {
                    service.notFound(service.gt.gettext('User not found'));
                    return;
                }
                
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


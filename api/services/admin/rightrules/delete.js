'use strict';


exports = module.exports = function(services, app) {
    
    var service = new services.delete(app);
    
    /**
     * Call the rightrules delete service
     * 
     * @param {int} id      Document mongoose ID
     * @return {Promise}
     */
    service.call = function(id) {
        
        
        service.models.RightRule.findById(id, function (err, document) {
            if (service.handleMongoError(err)) {
                document.remove(function(err) {
                    if (service.handleMongoError(err)) {
                        service.success(service.gt.gettext('The right rule has been deleted'));
                        
                        var rightrule = document.toObject();
                        rightrule.$outcome = service.outcome;
                        
                        service.deferred.resolve(rightrule);
                    }
                });
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};


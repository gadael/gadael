'use strict';


exports = module.exports = function(services, app) {
    
    var service = new services.delete(app);
    
    /**
     * Call the rightrules delete service
     * 
     * @param {object} params
     * @return {Promise}
     */
    service.call = function(params) {
        
        
        service.models.RightRule.findById(params.id, function (err, document) {
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


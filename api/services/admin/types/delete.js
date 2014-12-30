'use strict';


exports = module.exports = function(services, app) {
    
    var service = new services.delete(app);
    
    /**
     * Call the types delete service
     * 
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        
        var Gettext = require('node-gettext');
        var gt = new Gettext();

        
        service.app.db.models.Type.findById(params.id, function (err, document) {
            if (service.handleMongoError(err)) {
                document.remove(function(err) {
                    if (service.handleMongoError(err)) {
                        service.success(gt.gettext('The right type has been deleted'));
                        
                        var righttype = document.toObject();
                        righttype.$outcome = service.outcome;
                        
                        service.deferred.resolve(righttype);
                    }
                });
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};


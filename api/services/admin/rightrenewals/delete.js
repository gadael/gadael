'use strict';


exports = module.exports = function(services, app) {
    
    var service = new services.delete(app);
    
    /**
     * Call the rightrenewal delete service
     * 
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        
        var Gettext = require('node-gettext');
        var gt = new Gettext();

        
        service.app.db.models.RightRenewal.findById(params.id, function (err, document) {
            if (service.handleMongoError(err)) {
                document.remove(function(err) {
                    if (service.handleMongoError(err)) {
                        service.success(gt.gettext('The calendar has been deleted'));
                        
                        var rightrenewal = document.toObject();
                        rightrenewal.$outcome = service.outcome;
                        
                        service.deferred.resolve(rightrenewal);
                    }
                });
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};


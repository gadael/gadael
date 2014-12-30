'use strict';


exports = module.exports = function(services, app) {
    
    var Gettext = require('node-gettext');
    var gt = new Gettext();

    var service = new services.delete(app);
    
    /**
     * Call the calendar delete service
     * 
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        
        
        service.app.db.models.Calendar.findById(params.id, function (err, document) {
            if (service.handleMongoError(err)) {
                document.remove(function(err) {
                    if (service.handleMongoError(err)) {
                        service.success(gt.gettext('The calendar has been deleted'));
                        
                        var calendar = document.toObject();
                        calendar.$outcome = service.outcome;
                        
                        service.deferred.resolve(calendar);
                    }
                });
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};


'use strict';


exports = module.exports = function(services, app) {
    
    var Gettext = require('node-gettext');
    var gt = new Gettext();


    var service = new services.get(app);
    
    /**
     * Call the calendar get service
     * 
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        
        service.app.db.models.Calendar
        .findOne({ '_id' : params.id}, 'name url type')
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {
                    service.outcome.success = true;
                    service.deferred.resolve(document);
                } else {
                    service.notFound(gt.gettext('This calendar does not exists'));
                }
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};



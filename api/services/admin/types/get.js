'use strict';


exports = module.exports = function(services, app) {
    
    var service = new services.get(app);
    
    /**
     * Call the right type get service
     * 
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        
        const gt = require('./../../../../modules/gettext');

        service.app.db.models.Type
        .findOne({ '_id' : params.id})
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {
                    service.outcome.success = true;
                    service.deferred.resolve(document);
                } else {
                    service.notFound(gt.gettext('This right type does not exists'));
                }
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};



'use strict';


exports = module.exports = function(services, app) {
    
    var Gettext = require('node-gettext');
    var gt = new Gettext();


    var service = new services.get(app);
    
    /**
     * Call the right rule get service
     * 
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        
        service.app.db.models.RightRule
        .findOne({ '_id' : params.id}, 'right title quantity type interval')
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {
                    service.outcome.success = true;
                    service.deferred.resolve(document);
                } else {
                    service.notFound(gt.gettext('This right rule does not exists'));
                }
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};



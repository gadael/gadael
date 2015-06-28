'use strict';


exports = module.exports = function(services, app) {
    

    var Gettext = require('node-gettext');
    var gt = new Gettext();


    var service = new services.get(app);
    
    /**
     * Call the request get service
     * 
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        

        if (params.deleted === undefined) {
            params.deleted = false;
        }

        var filter = {
            _id: params.id,
            deleted: params.deleted
        };
        
        if (params.user) {
            filter['user.id'] = params.user;
        }
        
        
        
        service.app.db.models.Request
        .findOne(filter)
        .populate('absence.distribution')
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {
                    service.outcome.success = true;
                    service.deferred.resolve(document);
                } else {
                    service.notFound(gt.gettext('This request does not exists'));
                }
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};



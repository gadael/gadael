'use strict';


exports = module.exports = function(services, app) {
    
    var service = new services.get(app);
    
    /**
     * Call the request get service
     * 
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        
        var filter = {
            _id: params.id,
            deleted: false
        };
        
        if (params.user) {
            filter['user.id'] = params.user;
        }
        
        
        
        service.app.db.models.Request
        .findOne(filter)
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {
                    service.outcome.success = true;
                    service.deferred.resolve(document);
                } else {
                    service.notFound(service.gt.gettext('This request does not exists'));
                }
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};



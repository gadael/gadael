'use strict';


exports = module.exports = function(services, app) {
    
    var service = new services.get(app);
    
    /**
     * Call the AccountScheduleCalendar get service
     * 
     * @param {Object} params
     * @return {Promise}
     */
    service.call = function(params) {
        
        service.models.AccountScheduleCalendar
        .findOne({ '_id' : params.id }, 'account calendar from to')
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {
                    service.outcome.success = true;
                    service.deferred.resolve(document);
                } else {
                    service.notFound(service.gt.gettext('This schedule calendar does not exists for account'));
                }
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};

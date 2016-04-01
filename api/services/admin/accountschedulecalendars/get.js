'use strict';


exports = module.exports = function(services, app) {
    
    var service = new services.get(app);
    
    /**
     * Call the AccountScheduleCalendar get service
     * 
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        

        const gt = require('./../../../../modules/gettext');

        service.app.db.models.AccountScheduleCalendar
        .findOne({ '_id' : params.id }, 'account calendar from to')
        .populate('calendar')
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {
                    service.outcome.success = true;
                    service.deferred.resolve(document);
                } else {
                    service.notFound(gt.gettext('This schedule calendar does not exists for account'));
                }
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};

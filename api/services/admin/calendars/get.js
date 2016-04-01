'use strict';


exports = module.exports = function(services, app) {
    
    const gt = require('./../../../../modules/gettext');


    var service = new services.get(app);
    
    /**
     * Call the calendar get service
     * 
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        
        if (params.id === undefined) {
            return service.forbidden('Missing id parameter');
        }

        service.app.db.models.Calendar
        .findOne({ '_id' : params.id}, 'name url type halfDayHour')
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



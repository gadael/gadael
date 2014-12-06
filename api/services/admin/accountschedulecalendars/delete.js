'use strict';








exports = module.exports = function(services, app) {
    
    var service = new services.delete(app);
    
    
    
    
    /**
     * Validate before delete
     * @param   {AccountScheduleCalendar}  document mongoose document
     * @returns {Boolean}
     */
    function validate(document) {

        if (!document) {
            service.notFound(service.gt.gettext('this schedule calendar does not exists or is not linked to account'));
            return false;
        }

        if (document.from < new Date()) {
            service.forbidden(service.gt.gettext('Delete a schedule calendar period allready started is not allowed'));
            return false;
        }

        return true;
    }
    
    
    
    
    /**
     * Call the account schedule calendar delete service
     * 
     * @param {object} params
     * @return {Promise}
     */
    service.call = function(params) {
        
        
        service.models.AccountScheduleCalendar.findById(params.id, function (err, document) {
            if (service.handleMongoError(err)) {
                
                if (!validate(document)) {
                    return;
                }
                
                document.remove(function(err) {
                    if (service.handleMongoError(err)) {
                        service.success(service.gt.gettext('The collection has been removed from account'));
                        
                        var accountCalendar = document.toObject();
                        accountCalendar.$outcome = service.outcome;
                        
                        service.deferred.resolve(accountCalendar);
                    }
                });
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};


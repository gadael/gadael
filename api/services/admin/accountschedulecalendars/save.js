'use strict';



/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {

    if (service.needRequiredFields(params, ['calendar', 'from'])) {
        return;
    }
    
    saveAccountScheduleCalendar(service, params);
}




/**
 * Get account ID from query
 * @param {saveItemService} service
 * @param {object} params
 * @param {function} next
 */ 
function getAccount(service, params, next) {

    if (params.account) {
        next(params.account);
        return;
    }

    if (!params.user) {
        service.forbidden(service.gt.gettext('Cant create AccountScheduleCalendar, missing user or account'));
        return;
    }

    // find account from user
    service.models.User.findById(params.user, function(err, user) {
        if (service.handleMongoError(err)) {

            if (!user) {
                service.notFound(service.gt.gettext('User not found'));
                return;
            }

            if (!user.roles.account) {
                service.forbidden(service.gt.gettext('The user has no vacation account, schedule calendars are only linkable to accounts'));
                return;
            }

            next(user.roles.account);
        }
    });
}



    
    
/**
 * Update/create the AccountScheduleCalendar document
 * 
 * @param {saveItemService} service
 * @param {Object} params
 */  
function saveAccountScheduleCalendar(service, params) {
    
    var scheduleCalendar = service.models.AccountScheduleCalendar;
    var util = require('util');
    

    if (params.id) {
        scheduleCalendar.findById(params.id, function(err, document) {
            if (service.handleMongoError(err)) {
                if (null === document) {
                    service.notFound(util.format(service.gt.gettext('AccountScheduleCalendar document not found for id %s'), params.id));
                    return;
                }
                
                document.calendar 	= params.calendar._id;
                document.from 		= params.from;
                document.to 		= params.to;

                document.save(function (err) {
                    if (service.handleMongoError(err)) {
                        service.resolveSuccess(
                            document, 
                            service.gt.gettext('The account schedule calendar period has been modified')
                        );
                    }
                });
            }
        });

    } else {

        getAccount(service, params, function(accountId) {
        
            scheduleCalendar.create({
                    account: accountId,
                    calendar: params.calendar._id,
                    from: params.from,
                    to: params.to 
                }, function(err, document) {

                if (service.handleMongoError(err))
                {
                    service.resolveSuccess(
                        document, 
                        service.gt.gettext('The account schedule calendar period has been created')
                    );
                }
            });
            
        });
    }
}
    
    

    
    
    
    



/**
 * Construct the account schedule calendar save service
 * @param   {object}          services list of base classes from apiService
 * @param   {express|object}  app      express or headless app
 * @returns {saveItemService}
 */
exports = module.exports = function(services, app) {
    
    var service = new services.save(app);
    
    /**
     * Call the calendar save service
     * 
     * @param {Object} params
     *
     * @return {Promise}
     */
    service.call = function(params) {
        validate(service, params);
        return service.deferred.promise;
    };
    
    
    return service;
};



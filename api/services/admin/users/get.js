'use strict';

/**
 * Add account informations to the user object 
 *
 * @param {document} userDoc mongoose user document
 *                        
 * @return {Promise} resolve to a user object
 */
function userAccount(userDoc)
{
    var user = userDoc.toObject();
    var Q = require('q');
    var deferred = Q.defer();
    
    if (!userDoc.roles.account) {
        deferred.resolve(user);
    } else {
        
        Q.all([
            userDoc.roles.account.getCurrentCollection(),
            userDoc.roles.account.getCurrentScheduleCalendar()
        ]).then(function(results) {
            
            var collection = results[0];
            var calendar = results[1];
            
            if (null !== collection) {
                user.roles.account.currentCollection = collection.toObject();
            }

            if (null !== calendar) {
                user.roles.account.currentScheduleCalendar = calendar.toObject();
            }
        
            deferred.resolve(user);
        })
        .catch(deferred.reject);
    }
    
    return deferred.promise;
}


exports = module.exports = function(services, app) {
    
    var service = new services.get(app);
    
    /**
     * Call the users get service
     * 
     * @param {Object} params
     * @return {Promise}
     */
    service.call = function(params) {
        
        service.models.User
        .findOne({ '_id' : params.id}, 'lastname firstname email isActive department roles')
        .populate('department')
        .populate('roles.account')
        .populate('roles.admin')
        .populate('roles.manager')
        .exec(function(err, user) {
            if (service.handleMongoError(err))
            {
                if (user) {
                    
                    userAccount(user).then(function(userObj) {
                        service.outcome.success = true;
                        service.deferred.resolve(userObj);
                    });
                    
                    
                } else {
                    service.notFound(service.gt.gettext('This user does not exists'));
                }
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};



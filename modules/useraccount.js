'use strict';

/**
 * Add account informations to the user object
 * module used by the admin users service
 *
 * @param {document} userDoc mongoose user document
 *                        
 * @return {Promise} resolve to a user object
 */
exports = module.exports = function userAccount(userDoc)
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
};

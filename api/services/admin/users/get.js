'use strict';

/**
 * Add account informations 
 *
 * @param {document} userDoc mongoose user document
 *                        
 * @return {Promise} resolve to a user object
 */
function userAccount(userDoc)
{
    var user = userDoc.toObject();
    var deferred = require('q').defer();
    
    if (!userDoc.roles.account) {
        return deferred.resolve(user);
    }

    userDoc.roles.account.getCurrentCollection().then(function(collection) {
        user.roles.account.currentCollection = collection.toObject();
        return deferred.resolve(user);
    })
    .catch(deferred.reject);
    
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



'use strict';


exports = module.exports = function(services, app) {
    
    var service = new services.get(app);
    
    /**
     * Call the users get service
     * @return Promise
     */
    service.call = function(params) {
        
        service.models.User
        .findOne({ '_id' : params.id}, 'lastname firstname email isActive department roles')
        .populate('roles.account')
        .populate('roles.admin')
        .populate('roles.manager')
        .exec(function(err, user) {
            if (service.handleMongoError(err))
            {
                if (user) {
                    service.outcome.success = true;
                    service.deferred.resolve(user);
                } else {
                    service.notFound(service.gt.gettext('This user does not exists'));
                }
            }
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};



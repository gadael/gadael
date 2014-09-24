'use strict';

var getService = require('../../../../modules/service').get;



exports = module.exports = function(app) {
    var get = new getService(app);
    
    /**
     * 
     */
    get.call = function(params) {

        
        var service = this;
        
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
};



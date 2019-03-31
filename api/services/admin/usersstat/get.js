'use strict';

exports = module.exports = function(services, app) {



    var service = new services.get(app);

    /**
     * Call the users stat get service
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        service.app.db.models.User
        .find()
        .where('isActive', true)
        .countDocuments()
        .exec()
        .then(function(userCount) {
            service.outcome.success = true;
            service.deferred.resolve({
                activeUsers: userCount
            });
        })
        .catch(service.error);

        return service.deferred.promise;
    };


    return service;
};

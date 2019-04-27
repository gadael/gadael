'use strict';

exports = module.exports = function(services, app) {
    const service = new services.list(app);

    /**
     * Call the api tokens list service
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     * @return {Promise}
     */
    service.getResultPromise = function(params, paginate) {

        const find = service.app.db.models.User.find()
            .where('api.clientId').exists()
            .select('email api').sort('email');

        service.resolveQuery(find, paginate, function(err, docs) {
            if (service.handleMongoError(err)) {
                service.deferred.resolve(docs.map(function(user) {
                    return user.api;
                }));
            }
        });

        return service.deferred.promise;
    };

    return service;
};

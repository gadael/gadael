

exports = module.exports = function(services, app) {

    'use strict';

    var service = new services.list(app);

    /**
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params, paginate) {
        service.deferred.resolve([{
            name: 'TEST',
            readonly: params.readonly || null,
            empty: params.empty
        }]);

        return service.deferred.promise;
    };


    return service;
};



exports = module.exports = function(services, app) {

    'use strict';

    var service = new services.get(app);

    /**
     * @param {Object} params
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        service.deferred.resolve({
            name: 'TEST',
            readonly: params.readonly || null,
            id: params.id || null,
            empty: params.empty
        });

        return service.deferred.promise;
    };


    return service;
};

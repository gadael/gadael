

exports = module.exports = function(services, app) {

    'use strict';

    var service = new services.delete(app);

    /**
     * @param {Object} params
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        service.resolveSuccess({ name: 'TEST', readonly: params.readonly || null }, 'Deleted');

        return service.deferred.promise;
    };


    return service;
};

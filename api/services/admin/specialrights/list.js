'use strict';


exports = module.exports = function(services, app) {

    var service = new services.list(app);

    /**
     * Call the special rights list service
     *
     * @param {Object} params
     *
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {



        return service.deferred.promise;
    };


    return service;
};


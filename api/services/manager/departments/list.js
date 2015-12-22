'use strict';


/**
 * The manager managed departments list
 */







exports = module.exports = function(services, app) {

    var service = new services.list(app);

    /**
     * Call the requests list service
     *
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params, paginate) {


        return service.deferred.promise;
    };


    return service;
};





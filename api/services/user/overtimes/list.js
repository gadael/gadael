'use strict';
/**
 * The Admin overtime list service
 */

/**
 * Create the query with filters
 *
 * @param {listItemsService} service
 * @param {array} params      query parameters if called by controller
 *
 * @return {Query}
 */
var query = function(service, params) {
    const find = service.app.db.models.Overtime.find();
    if (params && params.settled) {
        find.where({ settled: params.settled });
    }

    if (params && params['user.id']) {
        find.where({ 'user.id': params['user.id'] });
    }

    return find;
};


exports = module.exports = function(services, app) {
    const service = new services.list(app);
    /**
     * Call the overtime list service
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params, paginate) {
        service.resolveQuery(
            query(service, params).sort('timeCreated'),
            paginate
        );

        return service.deferred.promise;
    };

    return service;
};

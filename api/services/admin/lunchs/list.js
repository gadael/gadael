'use strict';

/**
 * Create the query with filters
 *
 * @param {listItemsService} service
 * @param {array} params      query parameters if called by controller
 *
 * @return {Query}
 */
var query = function(service, params) {
    const find = service.app.db.models.Lunch.aggregate();
    if (undefined !== params['user.id']) {
        find.where({ 'user.id': params['user.id'] });
    }

    if (undefined !== params['user.name']) {
        find.where({ 'user.name': new RegExp(params['user.name'], 'i') });
    }

    find.group({
        _id: { $dateToString: { format: '%Y-%m', date: '$day' } },
        count: { $sum: 1 }
    });
    find.sort({ '_id': -1 });

    return find;
};


exports = module.exports = function(services, app) {
    const service = new services.list(app);

    /**
     * Call the lunchs list service
     *
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params, paginate) {
        service.resolveQuery(
            query(service, params),
            paginate
        );

        return service.deferred.promise;
    };


    return service;
};

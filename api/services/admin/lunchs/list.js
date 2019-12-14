'use strict';

const mongoose = require('mongoose');

/**
 * Create the query with filters
 *
 * @param {listItemsService} service
 * @param {array} params      query parameters if called by controller
 *
 * @return {Query}
 */
var query = function(service, params) {
    const aggregate = service.app.db.models.Lunch.aggregate();
    if (undefined !== params['user.id']) {
        aggregate.match({ 'user.id': mongoose.Types.ObjectId(params['user.id']) });
    }

    aggregate.group({
        _id: { $dateToString: { format: '%Y-%m', date: '$day' } },
        count: { $sum: 1 }
    });
    aggregate.sort({ '_id': -1 });

    return aggregate;
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

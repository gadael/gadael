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
    const aggregate = service.app.db.models.Overtime.aggregate();

    aggregate.match({ 'user.id': mongoose.Types.ObjectId(params.user) });
    aggregate.group({
        _id: { $dateToString: { format: '%Y', date: '$day' } },
        declarations: { $sum: 1 },
        total: { $sum: '$quantity' },
        settled: { $sum: '$settledQuantity' }
    });
    aggregate.sort({ '_id': -1 });

    return aggregate;
};


exports = module.exports = function(services, app) {
    const service = new services.list(app);

    /**
     * Call the overtime summary list service
     *
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params, paginate) {
        if (undefined === params.user) {
            service.error('Missing user parameter');
            return service.deferred.promise;
        }

        service.resolveQuery(
            query(service, params),
            paginate
        );

        return service.deferred.promise;
    };

    return service;
};

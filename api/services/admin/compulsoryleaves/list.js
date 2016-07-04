'use strict';


/**
 * The Admin compulsory leave list service
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

    var find = service.app.db.models.CompulsoryLeave.find();


    if (params && params.collection)
    {
        find.where({ collection: params.collection });
    }

    if (params && params.department)
    {
        find.where({ department: params.department });
    }

    if (params && params.moment)
    {
        find.where({ dtstart: { $lte:params.moment } });
        find.where({ dtend: { $gte:params.moment } });
    }


    find.populate('collections');
    find.populate('departments');

    return find;
};




exports = module.exports = function(services, app) {

    var service = new services.list(app);

    /**
     * Call the compulsory leave list service
     *
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params, paginate) {

        service.resolveQuery(
            query(service, params).sort('dtstart'),
            paginate
        );

        return service.deferred.promise;
    };


    return service;
};





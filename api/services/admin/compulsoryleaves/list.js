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

    if (params && params.name)
    {
        find.where({ name: new RegExp('^'+params.name, 'i') });
    }

    if (params && params.right)
    {
        find.where({ right: params.right });
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





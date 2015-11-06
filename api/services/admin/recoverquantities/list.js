'use strict';


/**
 * The Admin recover quantities list service
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

    var find = service.app.db.models.RecoverQuantity.find();

    if (params && params.name)
    {
        find.where({ name: new RegExp('^'+params.name, 'i') });
    }

    return find;
};




exports = module.exports = function(services, app) {

    var service = new services.list(app);

    /**
     * Call the recover quantities list service
     *
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params, paginate) {

        service.resolveQuery(
            query(service, params).select('name quantity quantity_unit').sort('name'),
            paginate
        );

        return service.deferred.promise;
    };


    return service;
};





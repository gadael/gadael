'use strict';


/**
 * The Admin right types list service
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

    var find = service.app.db.models.Type.find();

    if (params.name)
    {
         find.where({ name: new RegExp('^'+params.name, 'i') });
    }

    find.sort('sortkey');

    return find;
};




exports = module.exports = function(services, app) {
    
    var service = new services.list(app);
    
    /**
     * Call the right types list service
     * 
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params, paginate) {

        service.resolveQuery(
            query(service, params).sort('name'),
            paginate
        );

        return service.deferred.promise;
    };
    
    
    return service;
};





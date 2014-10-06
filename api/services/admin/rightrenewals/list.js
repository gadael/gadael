'use strict';


/**
 * The Admin right renewal list service
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

    var find = service.models.RightRenewal.find();

    if (params && params.right)
    {
        find.where({ right: params.right });
    }
    
    return find;
};




exports = module.exports = function(services, app) {
    
    var service = new services.list(app);
    
    /**
     * Call the right renewal list service
     * 
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.call = function(params, paginate) {
          
        var cols = 'right start finish';
        var sortkey = 'start';
        
        service.resolveQuery(
            query(service, params),
            cols,
            sortkey,
            paginate
        );

        return service.deferred.promise;
    };
    
    
    return service;
};





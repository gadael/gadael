'use strict';


/**
 * The Admin department list service
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

    var find = service.models.Department.find();

    if (params && params.name)
    {
        find.where({ name: new RegExp('^'+params.name, 'i') });
    }

    return find;
};




exports = module.exports = function(services, app) {
    
    var service = new services.list(app);
    
    /**
     * Call the departments list service
     * 
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.call = function(params, paginate) {
          
        var cols = 'name';
        var sortkey = 'name';
        
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





'use strict';


/**
 * The Admin vacation rights list service
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

    var find = service.models.Right.find();

    if (params.name) {
        find.where({ name: new RegExp('^'+params.name, 'i') });
    }
    
    if (params.type) {
        find.where({ type: params.type });
    }
    
    find.populate('type');
    
    return find;
};




exports = module.exports = function(services, app) {
    
    var service = new services.list(app);
    
    /**
     * Call the vacation rights list service
     * 
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.call = function(params, paginate) {
          
        var cols = 'name description type quantity quantity_unit';
        var sortkey = 'sortkey';
        
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





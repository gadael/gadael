'use strict';


/**
 * The Admin account collection list service
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

    var find = service.models.AccountCollection.find();
    find.populate('rightCollection');

    if (params && params.account)
    {
        find.where({ account: params.account });
    }

    return find;
};



/**
 * [[Description]]
 * @param   {Object} services  base classes from apiService
 * @param   {express|object} app      express or headless app
 * @returns {listItemsService}
 */
exports = module.exports = function(services, app) {
    
    var service = new services.list(app);
    
    /**
     * Call the AccountCollections list service
     * 
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.call = function(params, paginate) {
          
        var cols = 'account rightCollection from to';
        var sortkey = 'from';
        
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





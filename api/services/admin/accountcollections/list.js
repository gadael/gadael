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

    var find = service.app.db.models.AccountCollection.find();
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
    service.getResultPromise = function(params, paginate) {
        
        var find = query(service, params);
        find.select('account rightCollection from to');
        find.sort('from');

        service.resolveQuery(find, paginate);

        return service.deferred.promise;
    };
    
    
    return service;
};





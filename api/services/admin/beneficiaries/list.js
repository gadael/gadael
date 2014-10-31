'use strict';


/**
 * The Admin beneficiaries list service
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

    var find = service.models.Beneficiary.find();
    find.populate('right');

    if (params && params.account)
    {
        find.where({ account: params.account });
    }

    return find;
};



/**
 * Export list service
 * @param   {Object} services  base classes from apiService
 * @param   {express|object} app      express or headless app
 * @returns {listItemsService}
 */
exports = module.exports = function(services, app) {
    
    var service = new services.list(app);
    
    /**
     * Call the beneficiaries list service
     * 
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.call = function(params, paginate) {
          
        var cols = 'right document ref';
        var sortkey = 'right.name';
        
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





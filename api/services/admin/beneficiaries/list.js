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
 * @return {Promise} resolve to query
 */
function getQuery(service, params) {

    var deferred = require('q').defer();
    var find = service.models.Beneficiary.find();
    find.populate('right');
    
    if (!params) {
        deferred.resolve(find);
        return deferred.promise; 
    }
    
    if (null !== params.account) {
        service.models.Account
            .findOne({ _id: params.account})
            .exec(function(err, account) {
            
            account.getCurrentCollection().then(function(rightCollection) {
                
                var docs = [account.user.id];
                
                if (rightCollection) {
                    docs.push(rightCollection._id);
                }
                
                find.where('document').in(docs);
                deferred.resolve(find);
            });
        });
        
        return deferred.promise; 
    }

    find.where(params);
    deferred.resolve(find);
    
    return deferred.promise;
}



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
        
        getQuery(service, params).then(function(query) {
            
            console.log('query resolved');
            
            service.resolveQuery(
                query,
                cols,
                sortkey,
                paginate
            );
        });
        

        return service.deferred.promise;
    };
    
    
    return service;
};





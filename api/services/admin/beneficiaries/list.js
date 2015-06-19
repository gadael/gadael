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
    var find = service.app.db.models.Beneficiary.find({});
    find.populate('right');
    

    if (!params || Object.getOwnPropertyNames(params).length === 0) {
        deferred.resolve(find);
        return deferred.promise; 
    }
    
    if (null !== params.account) {
        service.app.db.models.Account
            .findOne({ _id: params.account})
            .exec(function(err, account) {
            
            if (service.handleMongoError(err)) {
                
                if (null === account) {
                    deferred.resolve(find);
                    return;
                }
                
                var docs = [account.user.id];
                
                account.getCurrentCollection().then(function(rightCollection) {

                    if (rightCollection) {
                        docs.push(rightCollection._id);
                    }

                    find.where('document').in(docs);
                    deferred.resolve(find);
                });
                
            }
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
    service.getResultPromise = function(params, paginate) {
          
        var cols = 'right document ref';
        var sortkey = 'right.name';
        
        getQuery(service, params).then(function(query) {

            var Q = require('q');
            var populatedTypePromises = [];



            service.resolveQuery(
                query,
                cols,
                sortkey,
                paginate,
                function(err, docs) {
                    if (service.handleMongoError(err))
                    {
                        // populate type in right, wait for resolution of all promises before
                        // resolving the service

                        for(var i=0; i<docs.length; i++) {
                            var deferred = Q.defer();
                            docs[i].right.populate('type', deferred.makeNodeResolver());
                            populatedTypePromises.push(deferred.promise);
                        }

                        Q.all(populatedTypePromises).then(function() {
                            service.outcome.success = true;
                            service.deferred.resolve(docs);
                        }).catch(function(err) {

                            console.log(err);
                        });
                    }
                }
            );
        });
        

        return service.deferred.promise;
    };
    
    
    return service;
};





'use strict';


/**
 * The Admin collections list service
 */




/**
 * Create the query with filters
 * 
 * @param {listItemsService} service
 * @param {array} params      query parameters if called by controller
 */
var query = function(service, params) {

    var find = service.app.db.models.RightCollection.find();

    if (params && params.name)
    {
        find.where({ name: new RegExp('^'+params.name, 'i') });
    }

    return find;
};




exports = module.exports = function(services, app) {
    
    var service = new services.list(app);
    
    /**
     * Call the collections list service
     * 
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Query}
     */
    service.getResultPromise = function(params, paginate) {

        service.resolveQuery(
            query(service, params).select('name attendance').sort('name'),
            paginate,
            function(err, docs) {
                if (service.handleMongoError(err)) {

                    var async = require('async');
                    var collObj;
                    var collectionObjects = [];

                    async.eachSeries(docs,
                        function(collection, callback) {
                            collObj = collection.toObject();

                            collection.getRights().then(function(beneficiaries) {

                                collObj.rights = [];
                                beneficiaries.forEach(function(b) {
                                    collObj.rights.push(b.right);
                                });

                                collectionObjects.push(collObj);
                                callback();
                            });

                        },
                        function(err) {

                            if (err) {
                                service.outcome.success = false;
                                service.deferred.reject(err);
                                return;
                            }


                            service.outcome.success = true;
                            service.deferred.resolve(collectionObjects);
                        }
                    );
                }
            }
        );

        return service.deferred.promise;
    };
    
    
    return service;
};





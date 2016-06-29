'use strict';

let async = require('async');


/**
 * The Admin collections list service
 */




/**
 * Create the query with filters
 * 
 * @param {listItemsService} service
 * @param {array} params      query parameters if called by controller
 *
 *
 */
var query = function(service, params, next) {


    var find = service.app.db.models.RightCollection.find();

    if (params && params.name) {
        find.where({ name: new RegExp('^'+params.name, 'i') });
    }

    if (params && params.right) {
        var beneficiaryFind = service.app.db.models.Beneficiary.find();
        beneficiaryFind.where('right', params.right);
        beneficiaryFind.where('ref', 'RightCollection');
        beneficiaryFind.exec((err, beneficiaries) => {

            if (err) {
                return next(err);
            }

            var collectionIds = beneficiaries.map(b => { return b.document; });

            find.where({ _id: { $in: collectionIds } });
            next(null, find);
        });

        return;
    }


    next(null, find);
};




exports = module.exports = function(services, app) {
    
    var service = new services.list(app);
    
    /**
     * Call the collections list service
     * 
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params, paginate) {

        query(service, params, (err, find) => {

            if (err) {
                return service.deferred.reject(err);
            }

            service.resolveQuery(
                find.sort('name'),
                paginate,
                function(err, docs) {
                    if (service.handleMongoError(err)) {


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
                                    service.error(err);
                                    return;
                                }


                                service.outcome.success = true;
                                service.deferred.resolve(collectionObjects);
                            }
                        );
                    }
                }
            );

        });

        return service.deferred.promise;
    };
    
    
    return service;
};





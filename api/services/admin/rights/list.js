'use strict';


/**
 * The Admin vacation rights list service
 */




/**
 * Create the query with filters
 * 
 * @param {listItemsService} service
 * @param {array} params      query parameters if called by controller
 * @param {function} callback
 *
 * @return {Promise}
 */
function query(service, params, callback) {
    
    return new Promise((resolve, reject) => {

        let find = service.app.db.models.Right.find();

        if (params.name) {
            find.where({ name: new RegExp('^'+params.name, 'i') });
        }

        if (params.type) {
            find.where({ type: params.type });
        }

        find.populate('type');


        if (!params.collection) {
            return callback(null, find);
        }


        // rights in a collection

        let findCollRights = service.app.db.models.Beneficiary.find();
        findCollRights
            .where('ref').equals('RightCollection')
            .where('document').equals(params.collection);

        findCollRights.exec().then(rights => {
            let collRights = rights.map(r => { return r._id; });
            find.where({ _id: { $in: collRights } });
            callback(null, find);
        })
        .catch(callback);

    });
}



/**
 * process the mongoose documents resultset to an array of objects with additional content
 * like the current renewal
 * @param {Array} docs mongoose documents
 * 
 */
function getResultSet(docs, callback) {
    var async = require('async');
    
    async.map(
        docs, 
        function(doc, done) {
            var right = doc.toObject();
            
            doc.getLastRenewal()
                .then(function(lastRenewal) {
                    right.lastRenewal = lastRenewal;
                    return doc.getCurrentRenewal();
                })
                .then(function(currentRenewal) {
                    right.currentRenewal = currentRenewal;
                    done(null, right);
                })
                .catch(function(err) {
                    done(err);
                });
        }, 
        callback
    );
}



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
    service.getResultPromise = function(params, paginate) {
          
        query(service, params,(err, listQuery) => {

            if (err) {
                return service.error(err);
            }

            service.resolveQuery(
                listQuery.select('name description type quantity quantity_unit rules sortkey').sort('name'),
                paginate,
                function(err, docs) {
                    getResultSet(docs, service.mongOutcome);
                }
            );
        });


        return service.deferred.promise;
    };
    
    
    return service;
};





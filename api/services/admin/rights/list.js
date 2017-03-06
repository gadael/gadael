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
 *
 */
function query(service, params, callback) {

    /**
     * get rights linked to collection
     * @return {Promise}
     */
    function addCollectionParam(find) {
        return service.app.db.models.Beneficiary.find()
        .where('ref').equals('RightCollection')
        .where('document').equals(params.collection)
        .distinct('right')
        .exec()
        .then(rights => {
            find.where({ _id: { $in: rights } });
            return true;
        });
    }

    /**
     * get rights not linked with the ref type
     * If we need rights to link to a beneficiary with ref=User
     * then we will get the rights not linked to a beneficiary with ref=RightCollection
     * @return {Promise}
     */
    function addForBeneficiaryRefParam(find) {
        return service.app.db.models.Beneficiary.find()
        .where('ref').ne(params.forBeneficiaryRef)
        .distinct('right')
        .exec()
        .then(rights => {
            find.where({ _id: { $nin: rights } });
            return true;
        });
    }


    let find = service.app.db.models.Right.find();

    if (params.name) {
        find.where({ name: new RegExp('^'+params.name, 'i') });
    }

    if (params.type) {
        find.where({ type: params.type });
    }

    let promises = [];
    find.populate('type');


    if (params.collection) {
        promises.push(addCollectionParam(find));
    }

    if (params.forBeneficiaryRef) {
        promises.push(addForBeneficiaryRefParam(find));
    }


    Promise.all(promises)
    .then(() => {
        callback(null, find);
    })
    .catch(callback);
}



/**
 * process the mongoose documents resultset to an array of objects with additional content
 * like the current renewal
 * @param {Array} docs mongoose documents
 *
 */
function getResultSet(app, docs, callback) {
    const async = require('async');
    const dispunits = app.utility.dispunits;

    async.map(
        docs,
        function(doc, done) {
            let right = doc.toObject();
            let specialRight = doc.getSpecialRight();

            if (specialRight) {
                right.specialright = specialRight.getServiceObject();


                if (!specialRight.editQuantity) {
                    right.quantity = undefined;
                }
            }

            right.dispUnit = dispunits(right.quantity_unit, right.quantity);

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
                listQuery.sort('name'),
                paginate,
                function(err, docs) {
                    getResultSet(app, docs, service.mongOutcome);
                }
            );
        });


        return service.deferred.promise;
    };


    return service;
};

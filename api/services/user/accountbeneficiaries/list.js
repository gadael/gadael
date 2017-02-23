'use strict';

const renewalsMod = require('./renewals');


/**
 * The user account beneficiaries list service
 */








/**
 * Export list service
 * @param   {Object} services  base classes from apiService
 * @param   {express|object} app      express or headless app
 * @returns {listItemsService}
 */
exports = module.exports = function(services, app) {

    var service = new services.list(app);





    /**
     * Create the query with filters
     *
     * @param {array}    params query parameters if called by controller
     *                          params.account     Mandatory parameter to get the account beneficaries
     *                          [params.date]      Optional moment for collection selection
     * @param {function} next
     *
     */
    function getQuery(params, next) {


        var find = service.app.db.models.Beneficiary.find({});
        find.populate('right');

        service.app.db.models.Account
            .findOne({ _id: params.account})
            .populate('user.id')
            .exec((err, account) => {

            if (service.handleMongoError(err)) {

                if (null === account) {
                    find.where('document').in([]);
                    return next(find, account);
                }

                let docs = [account.user.id._id];
                let collectionPromise;

                if (undefined !== params.date) {
                    collectionPromise = account.getCollection(new Date(params.date));
                } else {
                    collectionPromise = account.getCurrentCollection();
                }

                collectionPromise.then(rightCollection => {

                    if (rightCollection) {
                        docs.push(rightCollection._id);
                    }

                    find.where('document').in(docs);

                    next(find, account);
                });
            }

        });

    }





     /**
     *
     * @param {Account} account
     * @param {User} user
     * @param {Array} beneficiaries array of mongoose documents
     * @param {Date} moment
     *
     * @return {Promise}    resolve to array of beneficiaries objects
     */
    function resolveAccountRights(account, user, beneficiaries, moment)
    {

        let processRenewals = renewalsMod(user, account);

        let promises = beneficiaries.map(beneficiaryDocument => {
            let rightDocument = beneficiaryDocument.right;
            let beneficiary = beneficiaryDocument.toObject();
            beneficiary.disp_unit = rightDocument.getDispUnit();

            return rightDocument.getAllRenewals()
            .then(renewals => {

                /**
                 * Store available quantity for each accessibles renewals
                 * renewals with right rules not verified will not be included
                 */
                beneficiary.renewals = [];

                /**
                 * Sum of quantities from the accessibles renewals
                 */
                beneficiary.initial_quantity = 0;
                beneficiary.available_quantity = 0;
                beneficiary.consumed_quantity = 0;
                beneficiary.waiting_quantity = {
                    created: 0,
                    deleted: 0
                };

                return processRenewals(rightDocument, beneficiary, renewals, moment)
                .then(beneficiary => {

                    beneficiary.initial_quantity_dispUnit = rightDocument.getDispUnit(beneficiary.initial_quantity);
                    beneficiary.consumed_quantity_dispUnit = rightDocument.getDispUnit(beneficiary.consumed_quantity);
                    beneficiary.available_quantity_dispUnit = rightDocument.getDispUnit(beneficiary.available_quantity);
                    beneficiary.waiting_quantity.created_dispUnit = rightDocument.getDispUnit(beneficiary.waiting_quantity.created);
                    beneficiary.waiting_quantity.deleted_dispUnit = rightDocument.getDispUnit(beneficiary.waiting_quantity.deleted);

                    return beneficiary;

                });
            });
        });

        return Promise.all(promises);
    }






    /**
     * Call the beneficiaries list service
     *
     * @param {Object} params
     * @param {function} [paginate]  Optional parameter to paginate the results
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params, paginate) {

        if (undefined === params || !params.account) {
            service.error('The account parameter is mandatory');
            return service.deferred.promise;
        }

        let moment = new Date();
        if (undefined !== params.moment) {
            moment = new Date(params.moment);
        }

        getQuery(params, function(query, account) {

            query.select('right document ref');
            query.sort('right.name');

            var populatedTypePromises = [];

            service.resolveQuery(
                query,
                paginate,
                function(err, docs) {
                    if (service.handleMongoError(err))
                    {
                        // populate type in right, wait for resolution of all promises before
                        // resolving the service



                        for(var i=0; i<docs.length; i++) {
                            populatedTypePromises.push(docs[i].right.populate('type').execPopulate());
                        }

                        Promise.all(populatedTypePromises).then(function() {
                            return resolveAccountRights(account, account.user.id, docs, moment);
                        })
                        .then(beneficiaries => {
                            service.outcome.success = true;
                            service.deferred.resolve(beneficiaries);
                        })
                        .catch(function(err) {
                            service.error(err.message);
                        });
                    }
                }
            );
        });


        return service.deferred.promise;
    };


    return service;
};

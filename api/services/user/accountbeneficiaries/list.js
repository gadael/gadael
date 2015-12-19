'use strict';


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
    var Q = require('q');




    /**
     * Create the query with filters
     *
     * @param {array} params      query parameters if called by controller
     *                            params.account     mandatory parameter to get the account beneficaries
     * @param {function} next
     *
     */
    function getQuery(params, next) {


        var find = service.app.db.models.Beneficiary.find({});
        find.populate('right');

        service.app.db.models.Account
            .findOne({ _id: params.account})
            .populate('user.id')
            .exec(function(err, account) {

            if (service.handleMongoError(err)) {

                if (null === account) {
                    find.where('document').in([]);
                    return next(find, account);
                }

                var docs = [account.user.id._id];

                account.getCurrentCollection().then(function(rightCollection) {

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
     * @param {Array} rights array of mongoose documents
     */
    function resolveAccountRights(account, user, beneficiaries)
    {
        var async = require('async');

        var output = [];

        var processRenewals = require('./renewals')(user, account);


        async.each(beneficiaries, function(beneficiaryDocument, cb) {

            var rightDocument = beneficiaryDocument.right;
            var beneficiary = beneficiaryDocument.toObject();
            beneficiary.disp_unit = rightDocument.getDispUnit();


            rightDocument.getAllRenewals().then(function(renewals) {

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

                processRenewals(rightDocument, beneficiary, renewals, function done(err) {

                    if (err) {
                        return cb(err);
                    }

                    beneficiary.initial_quantity_dispUnit = rightDocument.getDispUnit(beneficiary.initial_quantity);
                    beneficiary.consumed_quantity_dispUnit = rightDocument.getDispUnit(beneficiary.consumed_quantity);
                    beneficiary.available_quantity_dispUnit = rightDocument.getDispUnit(beneficiary.available_quantity);

                    output.push(beneficiary);

                    cb();
                });

            });


        }, function(err) {

            if (err) {
                return service.error(err);
            }



            service.outcome.success = true;
            service.deferred.resolve(output);
        });
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
                            var deferred = Q.defer();
                            docs[i].right.populate('type', deferred.makeNodeResolver());
                            populatedTypePromises.push(deferred.promise);
                        }

                        Q.all(populatedTypePromises).then(function() {

                            resolveAccountRights(account, account.user.id, docs);

                        }).catch(function(err) {
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





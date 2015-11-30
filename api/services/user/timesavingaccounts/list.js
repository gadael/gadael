'use strict';


/**
 * The user available time saving accounts for the current date
 * according to the saving period
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
     * Get beneficiaries linked to a time saving right
     * @param {String} accountId
     * @return {Promise}
     */
    function getAccountBeneficiaries(accountId)
    {
        var deferred = Q.defer();

        service.app.db.models.Account
            .findOne({ _id: accountId})
            .populate('user.id')
            .exec(function(err, account) {

            if (err) {
                return deferred.reject(err);
            }



            if (null === account) {
                return deferred.reject('Account not found');
            }

            var timeSavingBeneficiaries = [];

            account.getRightBeneficiaries().then(function(beneficiaries) {

                beneficiaries.forEach(function(beneficiary) {

                    if (undefined === beneficiary.right) {
                        return;
                    }

                    var right = beneficiary.right;

                    if (undefined === right.timeSaving) {
                        return;
                    }

                    if (!right.timeSaving.active) {
                        return;
                    }



                    //right.getAllRenewals

                    timeSavingBeneficiaries.push(beneficiary);
                });

                deferred.resolve(timeSavingBeneficiaries);

            }, deferred.reject);


        });

        return deferred.promise;

    }



    /**
     * Get beneficiaries and renwals with active saving periods
     * @param {String} accountId
     * @return {Promise}
     */
    function getRenewals(accountId)
    {
        var async = require('async');
        var deferred = Q.defer();

        var results = [], savingPeriod;

        getAccountBeneficiaries(accountId).then(function(timeSavingBeneficiaries) {

            async.each(timeSavingBeneficiaries, function(beneficiary, callback) {

                beneficiary.right.getAllRenewals().then(function(renewals) {

                    for(var i=0; i<renewals.length; i++) {
                        savingPeriod = renewals[i].getSavingPeriod();

                        if (null === savingPeriod) {
                            continue;
                        }

                        results.push({
                            savingPeriod: savingPeriod,
                            renewal: renewals[i],
                            beneficiary: beneficiary
                        });
                    }

                    callback(null, results);
                });

            }, function eachEnd(err) {
                if (err) {
                    return deferred.reject(err);
                }
                deferred.resolve(results);
            });
        }, deferred.reject);

        return deferred.promise;
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


        getRenewals(params.account).then(service.deferred.resolve, service.error);



        return service.deferred.promise;
    };


    return service;
};


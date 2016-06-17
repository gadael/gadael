'use strict';

let Q = require('q');

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



    function getAccount(accountId)
    {
        return service.app.db.models.Account
            .findOne({ _id: accountId})
            .populate('user.id')
            .exec();
    }


    /**
     * Get beneficiaries linked to a time saving right
     * @param {Account} account
     * @return {Promise}
     */
    function getAccountBeneficiaries(account)
    {
            var deferred = Q.defer();


            var timeSavingBeneficiaries = [];

            account.getRightBeneficiaries().then(function(beneficiaries) {

                beneficiaries.forEach(function(beneficiary) {

                    if (undefined === beneficiary.right) {
                        return;
                    }

                    let right = beneficiary.right;


                    if (undefined === right.special || 'timesavingaccount' !== right.special) {
                        return;
                    }


                    timeSavingBeneficiaries.push(beneficiary);
                });

                deferred.resolve(timeSavingBeneficiaries);

            }, deferred.reject);


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
        var dispUnits = require('../../../../modules/dispunits');
        var deferred = Q.defer();

        var results = [], savingPeriod;
        var user;

        function getUser(account) {
            user = account.user.id;
            return Q(account);
        }

        getAccount(accountId)
            .then(getUser)
            .then(getAccountBeneficiaries)
            .then(function(timeSavingBeneficiaries) {

            async.each(timeSavingBeneficiaries, function(beneficiary, callback) {


                beneficiary.right.getAllRenewals().then(function(renewals) {


                    async.each(renewals, function(renewal, renewalCb) {

                        savingPeriod = renewal.getSavingPeriod(beneficiary.right);

                        if (null === savingPeriod) {
                            return renewalCb();
                        }

                        beneficiary = beneficiary.toObject();
                        beneficiary.right.timeSaving.max_dispUnit = dispUnits(
                            beneficiary.right.quantity_unit,
                            beneficiary.right.timeSaving.max
                        );

                        renewal.getUserAvailableQuantity(user).then(function(availableQuantity) {

                            results.push({
                                savingPeriod: savingPeriod,
                                renewal: renewal,
                                beneficiary: beneficiary,
                                availableQuantity: availableQuantity,
                                availableQuantity_dispUnit: dispUnits(beneficiary.right.quantity_unit, availableQuantity)
                            });

                            renewalCb();
                        }, renewalCb);

                    }, function(err) {
                        callback(err, results);
                    });


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


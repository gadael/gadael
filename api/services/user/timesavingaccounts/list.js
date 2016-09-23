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
    const dispunits = app.utility.dispunits;


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

        var timeSavingBeneficiaries = [];

        return account.getRightBeneficiaries()
        .then(function(beneficiaries) {

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

            return timeSavingBeneficiaries;

        });
    }



    /**
     * Get beneficiaries and renwals with active saving periods
     * @param {String} accountId
     * @return {Promise}
     */
    function getRenewals(accountId)
    {
        var async = require('async');

        var results = [], savingPeriod;
        var user;

        function getUser(account) {
            user = account.user.id;
            return Promise.resolve(account);
        }

        return getAccount(accountId)
        .then(getUser)
        .then(getAccountBeneficiaries)
        .then(timeSavingBeneficiaries => {

            return new Promise((resolve, reject) => {

                async.each(timeSavingBeneficiaries, function(beneficiary, callback) {


                    beneficiary.right.getAllRenewals().then(function(renewals) {


                        async.each(renewals, function(renewal, renewalCb) {

                            savingPeriod = renewal.getSavingPeriod(beneficiary.right);

                            if (null === savingPeriod) {
                                return renewalCb();
                            }

                            beneficiary = beneficiary.toObject();
                            beneficiary.right.timeSaving.max_dispUnit = dispunits(
                                beneficiary.right.quantity_unit,
                                beneficiary.right.timeSaving.max
                            );

                            renewal.getUserAvailableQuantity(user).then(function(availableQuantity) {

                                results.push({
                                    savingPeriod: savingPeriod,
                                    renewal: renewal,
                                    beneficiary: beneficiary,
                                    availableQuantity: availableQuantity,
                                    availableQuantity_dispUnit: dispunits(beneficiary.right.quantity_unit, availableQuantity)
                                });

                                renewalCb();
                            }, renewalCb);

                        }, function(err) {
                            callback(err, results);
                        });


                    });

                }, function eachEnd(err) {
                    if (err) {
                        return reject(err);
                    }

                    resolve(results);
                });
            });
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


        getRenewals(params.account).then(service.deferred.resolve, service.error);



        return service.deferred.promise;
    };


    return service;
};

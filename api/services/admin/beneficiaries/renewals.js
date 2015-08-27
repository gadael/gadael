exports = module.exports = function(user, account) {

    'use strict';

    var async = require('async');

    /**
     * Get the promise for the available quantity
     * @param   {Right} right
     * @param   {RightRenewal} renewal
     * @returns {Promise} resolve to a number
     */
    function getRenewalAvailableQuantity(right, renewal) {

        if (account.arrival > renewal.finish) {
            return null;
        }

        return renewal.getUserAvailableQuantity(user);
    }




    /**
     * add renewals into the right object
     * @param {Right} rightDocument
     * @param {object} right
     * @param {Array} renewals
     * @param {function} callback
     */
    function processRenewals(rightDocument, beneficiary, renewals, callback)
    {
        async.each(renewals, function(renewalDocument, renewalCallback) {
            var p = getRenewalAvailableQuantity(rightDocument, renewalDocument);

            if (null === p) {
                // no error but the right is discarded in this renewal because of the rules or missing renewal
                return renewalCallback();
            }

            p.then(function(quantity) {

                var renewalObj = renewalDocument.toObject();
                renewalObj.available_quantity = quantity;
                beneficiary.renewals.push(renewalObj);
                beneficiary.available_quantity += quantity;

                renewalCallback();

            }, renewalCallback);

        }, callback);
    }


    return processRenewals;
};

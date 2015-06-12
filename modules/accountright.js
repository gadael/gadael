/**
 * @param {Account} account mongoose document
 * @param {Beneficiary} beneficiary the vacation right attribution with right populated
 *
 */
function accountRight(account, beneficiary)
{
    'use strict';

    this.account = account;
    this.beneficiary = beneficiary;
    this.right = beneficiary.right;

    var self = this;

    var Q = require('q');

    /**
     * Sum of quantities from waiting requests
     * @return {Promise}    Number
     */
    this.prototype.getWaitingQuantity = function()
    {
        var deferred = Q.defer();
        return deferred.promise;
    };

     /**
     * Sum of quantities from confirmed requests
     * @return {Promise}    Number
     */
    this.prototype.getConfirmedQuantity = function()
    {
        var deferred = Q.defer();
        return deferred.promise;
    };

    /**
     * @return {Promise}    Number
     */
    this.prototype.getConsumedQuantity = function()
    {
        var deferred = Q.defer();
        Q.all([self.getWaitingQuantity(), self.getConfirmedQuantity()]).then(function(arr) {
            deferred.resolve(arr[0] + arr[1]);
        }, deferred.reject);
        return deferred.promise;
    };


    /**
     * @return {Promise}    Number
     */
    this.prototype.getAvailableQuantity = function()
    {
        var deferred = Q.defer();
        return deferred.promise;
    };
}



exports = module.exports = accountRight;

/**
 * @param {Account} account mongoose document
 * @param {RightRenewal} renewal the vacation right attribution with right populated
 *
 */
function accountRight(account, renewal)
{
    'use strict';


    this.account = account;
    this.right = renewal.right;
    this.renewal = renewal;

    var self = this;

    var Q = require('q');

    /**
     * Sum of consumed quantities from waiting requests
     * @return {Promise}    Number
     */
    this.prototype.getWaitingQuantity = function()
    {
        var deferred = Q.defer();
        var AbsenceElemModel = self.renewal.model('AbsenceElem');

        AbsenceElemModel
            .find({ 'right.renewal': self.renewal._id, 'user.id': self.account.user.id })
            .exec(function(err, elements) {

            var consumed = 0;

            for(var i=0; i<elements.length; i++) {
                consumed += elements[i].consumedQuantity;
            }

            deferred.resolve(consumed);
        });

        return deferred.promise;
    };

     /**
     * Sum of consumed quantities from confirmed requests
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

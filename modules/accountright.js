/**
 * @module accountright
 * @deprecated Replaced by methods on renewal
 */

'use strict';


/**
 * This object represent one right associated to one user account
 * @constructor
 * @param {Account} account mongoose document
 * @param {RightRenewal} renewal the vacation right attribution with right populated
 *
 */
function accountRight(account, renewal)
{

    if (renewal.right === undefined || renewal.right._id === undefined) {
        throw new Error('The renewal need a vacation right');
    }


    this.account = account;
    this.right = renewal.right;
    this.renewal = renewal;

}



/**
 * Sum of consumed quantities from waiting requests
 * @return {Promise}    promise resolve to a number
 */
accountRight.prototype.getWaitingQuantity = function()
{


    var AbsenceElemModel = this.renewal.model('AbsenceElem');

    return AbsenceElemModel
    .find({ 'right.renewal': this.renewal._id, 'user.id': this.account.user.id })
    .exec()
    .then(elements => {

        var consumed = 0;

        for(var i=0; i<elements.length; i++) {
            consumed += elements[i].consumedQuantity;
        }

        return consumed;
    });
};



/**
 * Get consumed quantity
 * this is the quantity from accepted requests, consumed from right according to the collection percentage
 *
 * @return {Promise}    promise resolve to a number
 */
accountRight.prototype.getConsumedQuantity = function()
{


    var AbsenceElemModel = this.renewal.model('AbsenceElem');

    return AbsenceElemModel
    .find({
        'right.renewal.id': this.renewal._id,
        'user.id': this.account.user.id
    }) // , 'absence.distribution.consumedQuantity'
    .exec()
    .then(elements => {

        var consumed = 0;

        for(var i=0; i<elements.length; i++) {

                if (elements[i].consumedQuantity === undefined) {
                    throw new Error('The consumed quantity field is missing on element');
                }

                consumed += elements[i].consumedQuantity;

        }

        return consumed;
    });

};


/**
 * Get available quantity
 * Available quantity is the initial quantity less the consumed quantity (from accepted requests only)
 * @return {Promise}    promise resolve to a number
 */
accountRight.prototype.getAvailableQuantity = function()
{
    var self = this;



    // Is there a specific quantity for this beneficiary and this renewal?
    // else get the right quantity

    return this.getConsumedQuantity()
    .then(function(consumed) {
        var initialQuantity = self.account.getQuantity(self.renewal);
        return (initialQuantity - consumed);
    });
};




exports = module.exports = accountRight;

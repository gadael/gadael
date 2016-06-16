'use strict';


/**
 * Special right base class
 * @param {Express} app
 */
function specialRight(app) {


    this.app = app;



    /**
     * If the right is a time saving target
     * it will be proposed as target in the request creation form (time saving deposit)
     * @var {Boolean}
     */
    this.timeSavingAccount = false;

    /**
     * if set to NULL, the value will be modifiable by admin
     * if set to D or H the value will be set on right creation and not modifiable
     * @var {String}
     */
    this.quantityUnit = 'D';

    /**
     * If set to true, the quantity will not be modifiable by admin
     * if set to false the getQuantity() must return the quantity field on right document because
     * the right will should act with the quantity set by administrator
     *
     * @var {Boolean}
     */
    this.quantityReadOnly = false;
}


/**
 * Test if the special right can be created by administrator
 * @return {boolean}
 */
specialRight.prototype.canCreate = function() {
    return true;
};


/**
 * Get special right description
 */
specialRight.prototype.getDescription = function() {
    return '';
};


/**
 * Get initial quantity used by renewals
 *
 * @see RightRenewal.getUserQuantity()
 *
 * @param {RightRenewal} renewal
 * @returns {Promise}
 */
specialRight.prototype.getQuantity = function(renewal) {
    if (!this.quantityReadOnly) {
        // modifiable by admin in right
        return renewal.getRightPromise()
        .then(right => {
            return right.quantity;
        });
    }
    return 0;
};


exports = module.exports = specialRight;

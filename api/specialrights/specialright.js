'use strict';


/**
 * Special right base class
 * @param {Express} app
 */
function specialRight(app) {


    this.app = app;


    /**
     * Default values for public properties
     */

    this.timeSavingAccount = false;

    this.quantityUnit = 'D';
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
 * @param {RightRenewal} renewal
 */
specialRight.prototype.getQuantity = function(renewal) {
    return 0;
};


exports = module.exports = specialRight;

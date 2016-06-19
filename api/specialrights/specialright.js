'use strict';


/**
 * Special right base class
 *
 * @constructor
 */
function SpecialRight() {




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
     * Quantity field stats on right edit form
     *
     * If set to true, the quantity will not be modifiable by admin
     * in this case, user getQuantityLabel to explain where quantity come from on the admin form
     *
     * if set to false the getQuantity() should return the quantity field on right document because
     * the right will should act with the quantity set by administrator.
     *
     * Another possiblity is quantityReadOnly=false and getQuantity return a custom value but in this case
     * the quantity label must be overloaded with an appropriate explanation
     * for example if the quantity is a base quantity and a computed value is added to it
     * @see specialright.getQuantityLabel
     *
     * @var {Boolean}
     */
    this.quantityReadOnly = false;


    /**
     * List of country ISO code where the special right can be created
     * this will be test apon company.country
     *
     * @var {Array} contain ISO 2 letter code
     */
    this.countries = [];
}


/**
 * Test if the special right can be created by administrator
 * @return {Promise}
 */
SpecialRight.prototype.canCreate = function(RightModel) {

    let special = this.constructor.name;

    return RightModel.count({ special: special }).then(count => {
        return (count === 0);
    });
};


/**
 * if return a string, the right name will not be modifiable
 * the name from this method will be used instead on right creation
 * @returns {String}
 */
SpecialRight.prototype.getName = function() {
    return null;
};


/**
 * Get special right description
 * displayed only to administrator
 *
 * @abstract
 *
 * @return {String} Internationalized string
 */
SpecialRight.prototype.getDescription = function() {
    throw new Error('must be implemented by subclass!');
};


/**
 * Get initial quantity used by renewals
 *
 * @see RightRenewal.getUserQuantity()
 *
 * @param {RightRenewal} renewal
 * @param {User}         user   User document with account role
 * @returns {Promise}
 */
SpecialRight.prototype.getQuantity = function(renewal, user) {
    if (!this.quantityReadOnly) {
        // modifiable by admin in right
        return renewal.getRightPromise()
        .then(right => {
            return right.quantity;
        });
    }
    return 0;
};


/**
 * A label addon on form as explanation on the quantity field
 * @returns {String} internationalized string
 */
SpecialRight.prototype.getQuantityLabel = function() {
    return null;
};



/**
 * Get object for service
 * Information needed for right creation
 * @returns {object}
 */
SpecialRight.prototype.getServiceObject = function() {
    return {
        special: this.constructor.name,
        name: this.getName(),
        description: this.getDescription()
    };
};



exports = module.exports = SpecialRight;

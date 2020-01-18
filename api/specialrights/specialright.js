'use strict';


/**
 * Special right base class
 *
 * @constructor
 */
function SpecialRight(app) {

    this.app = app;


    /**
     * If the right is a time saving target
     * it will be proposed as target in the request creation form (time saving deposit)
     * @var {Boolean}
     */
    this.timeSavingAccount = false;


    /**
     * Default quantity for right initialization
     * @var {Number}
     */
    this.quantity = 0;

    /**
     * if set to NULL, the value will be modifiable by admin
     * if set to D or H the value will be set on right creation and not modifiable
     * @var {String}
     */
    this.quantity_unit = 'D';

    /**
     * Quantity field stats on right edit form
     *
     * If set to false, the quantity will not be modifiable by admin
     * in this case, user getQuantityLabel to explain where quantity come from on the admin form
     *
     * Another possiblity is editQuantity=true and getQuantity return a custom value but in this case
     * the quantity label must be overloaded with an appropriate explanation
     * for example if the quantity is a base quantity and a computed value is added to it
     * @see specialright.getQuantityLabel
     *
     * @var {Boolean}
     */
    this.editQuantity = true;


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

    return RightModel.countDocuments({ special: special }).then(count => {
        return (count === 0);
    });
};


/**
 * if return a string, the right name will not be modifiable
 * the name from this method will be used instead on right creation
 * @returns {String}
 */
SpecialRight.prototype.getDefaultRightName = function() {
    return this.getName();
};




/**
 * Right description initialization
 * the description will not be modifiable if not null
 * @returns {String}
 */
SpecialRight.prototype.getDefaultRightDescription = function() {
    return null;
};


/**
 * Get special right name
 * displayed only to administrator
 * @returns {String}
 */
SpecialRight.prototype.getName = function() {
    throw new Error('must be implemented by subclass!');
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
 * @returns {Promise}   resolve to an object with a value property
 */
SpecialRight.prototype.getQuantity = function(renewal, user) {

    if (this.editQuantity) {
        // modifiable by admin in right
        return renewal.getRightPromise()
        .then(right => {
            return {
                value: right.quantity,
                special: true
            };
        });
    }

    return Promise.resolve({
        value: 0,
        special: true
    });
};


/**
 * A label addon on form as explanation on the quantity field
 * @returns {String} internationalized string
 */
SpecialRight.prototype.getQuantityLabel = function() {
    return null;
};


/**
 * get key name of special right, used in right document
 * @returns {String}
 */
SpecialRight.prototype.getSpecial = function() {
    return this.constructor.name.toLowerCase();
};


/**
 * Get object for service
 * Information needed for right creation
 * @returns {object}
 */
SpecialRight.prototype.getServiceObject = function() {
    return {
        name: this.getName(),
        description: this.getDescription(),
        countries: this.countries,
        editQuantity: this.editQuantity,
        quantityLabel: this.getQuantityLabel(),
        default: {
            special: this.getSpecial(),
            name: this.getDefaultRightName(),
            description: this.getDefaultRightDescription(),
            quantity: this.quantity,
            quantity_unit: this.quantity_unit
        }
    };
};



exports = module.exports = SpecialRight;

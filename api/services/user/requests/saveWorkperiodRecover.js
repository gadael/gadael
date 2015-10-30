'use strict';


/**
 * @throws Error
 * @param {Object}  wrParams        Worperiod recover request parmeters from post|put request
 */
function testRequired(wrParams)
{
    if (undefined === wrParams.quantity || wrParams.quantity <= 0) {
        throw new Error('The quantity parameter must be positive number');
    }

    if (undefined === wrParams.right) {
        throw new Error('The right parameter is mandatory');
    }

    var emptyName = (undefined === wrParams.right.name || '' === wrParams.right.name);
    if (emptyName || wrParams.right.name.length < 4) {
        throw new Error('The right.name parameter must be 3 characters at least');
    }

    return true;
}





/**
 * Get object to set into request.workperiod_recover on save
 *
 *
 * @param {Object}      wrParams        Worperiod recover request parmeters from post|put request
 *
 *
 * @return {Object}
 */
function getFieldsToSet(wrParams)
{

    if (!testRequired(wrParams)) {
        return null;
    }


    var fieldsToSet = {
        right: {}
    };

    fieldsToSet.quantity = wrParams.quantity;

    // only the approver can change gainedQuantity, this is initialized from quantity
    fieldsToSet.gainedQuantity = wrParams.quantity;

    // name set by creator for the new right
    fieldsToSet.right.name = wrParams.right.name;
    fieldsToSet.right.quantity_unit = wrParams.right.quantity_unit;

    return fieldsToSet;

}


/**
 * Create right if no approval
 *
 * @param {User}        user            Request owner
 * @param {Request}     document
 *
 * @return {Promise}    resolve to the Beneficiary document
 */
function createRight(user, document)
{
    document.createRecoveryRight().then(function(right) {
        // link right to user using a beneficiary
        return right.addUserBeneficiary(user);
    });
}



exports = module.exports = {
    getFieldsToSet: getFieldsToSet,
    createRight: createRight
};

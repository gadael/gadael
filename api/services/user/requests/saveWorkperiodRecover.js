'use strict';

var Q = require('q');

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
 * @param {apiService   service
 * @param {Object} wrParams
 * @return {Promise}
 */
function createRight(service, wrParams)
{

    var rightModel = service.app.db.models.Right;

    var right = new rightModel();
    right.name = wrParams.right.name;
    right.type = '';
    right.quantity = wrParams.quantity;
    right.quantity_unit = wrParams.right.quantity_unit;
    right.rules = [{
        title: 'Active for request dates in the renewal period',
        type: 'request_period'
    }];

    return right.save();
}

/**
 * @param {apiService   service
 * @param {Right} right
 * @return {Promise}
 */
function createRenewal(service, right)
{
    var renewalModel = service.app.db.models.RightRenewal;

    var renewal = new renewalModel();
    renewal.right = right._id;

    //TODO
    renewal.start = new Date();
    renewal.finish = new Date();


    return renewal.save();
}



/**
 * Get object to set into request.workperiod_recover on save
 * if no approval, right is created immediately
 *
 * @param {apiService   service
 * @param {User}        user            Request owner
 * @param {Object}      wrParams        Worperiod recover request parmeters from post|put request
 * @param {Boolean}     approval        True if request need approval
 *
 * @return {Promise}                Resolve to an object
 */
function getFieldsToSet(service, user, wrParams, approval)
{

    return Q.try(function() {
        testRequired(wrParams);

    }).then(function() {



        var fieldsToSet = {
            right: {}
        };

        fieldsToSet.quantity = wrParams.quantity;

        // only the approver can change gainedQuantity, this is initialized from quantity
        fieldsToSet.gainedQuantity = wrParams.quantity;

        // name set by creator for the new right
        fieldsToSet.right.name = wrParams.right.name;
        fieldsToSet.right.quantity_unit = wrParams.right.quantity_unit;

        if (approval) {
            return Q.fcall(function () {
                return fieldsToSet;
            });
        }


        var deferred = Q.defer();

        createRight(service, wrParams.right).then(function(right) {
            fieldsToSet.right.id = right._id;
            createRenewal(service, right).then(function(renewal) {
                fieldsToSet.right.renewal = {
                    id: renewal._id,
                    start: renewal.start,
                    finish: renewal.finish
                };

                deferred.resolve(fieldsToSet);
            });

        }, deferred.reject);


        return deferred.promise;
    });
}


exports = module.exports = {
    getFieldsToSet: getFieldsToSet
};

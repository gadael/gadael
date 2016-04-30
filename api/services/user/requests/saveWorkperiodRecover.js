'use strict';

let Q = require('q');

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

    if (undefined === wrParams.recoverQuantity) {
        throw new Error('The recoverQuantity parameter is mandatory');
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
 * @return {Promise}
 */
function getFieldsToSet(service, wrParams)
{

    var deferred = Q.defer();

    try {
        testRequired(wrParams);
    } catch (e) {
        deferred.reject(e.message);
        return deferred.promise;
    }


    var fieldsToSet = {
        right: {}
    };

    // the real quantity from the list of events, must be in the quantity unit of the recover quantity
    fieldsToSet.quantity = wrParams.quantity;

    // name set by creator for the new right
    fieldsToSet.right.name = wrParams.right.name;


    var RecoverQuantityModel = service.app.db.models.RecoverQuantity;



    RecoverQuantityModel.findOne({ _id: wrParams.recoverQuantity._id }).then(function(recoverQuantity) {

        if (!recoverQuantity) {
            return deferred.reject('Failed to get recover quantity from '+wrParams.recoverQuantity);
        }

        fieldsToSet.recoverQuantity = recoverQuantity._id;

        // gainedQuantity is the quantity provided by the selected recover quantity
        fieldsToSet.gainedQuantity = recoverQuantity.quantity;

        fieldsToSet.right.quantity_unit = recoverQuantity.quantity_unit;

        deferred.resolve(fieldsToSet);

    }, deferred.reject);



    return deferred.promise;

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

        if (null === right || undefined === right) {
            return Q(null);
        }

        // link right to user using a beneficiary
        return right.addUserBeneficiary(user);
    });
}


/**
 * create calendar events en resolve to an array of calendar event ID
 * @return {Promise}
 */
function getEventsPromise(service, param)
{
    if (!param || param.length === 0) {
        throw new Error('events parameter is mandatory');
    }

    var EventModel = service.app.db.models.CalendarEvent;
    var eventPromises = [];

    param.forEach(function(evt) {

        var event = new EventModel();
        event.dtstart = new Date(evt.dtstart);
        event.dtend = new Date(evt.dtend);
        eventPromises.push(event.save());
    });

    var deferred = Q.defer();

    var eventIds = [];

    Promise.all(eventPromises).then(function(events) {
        events.forEach(function(event) {
            eventIds.push(event);
        });

        deferred.resolve(eventIds);
    }, deferred.reject);

    return deferred.promise;
}



exports = module.exports = {
    getEventsPromise: getEventsPromise,
    getFieldsToSet: getFieldsToSet,
    createRight: createRight
};

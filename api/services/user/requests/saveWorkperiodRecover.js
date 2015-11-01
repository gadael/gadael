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

    // only the approver can change gainedQuantity
    fieldsToSet.gainedQuantity = 0;

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

    Q.all(eventPromises).then(function(events) {
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

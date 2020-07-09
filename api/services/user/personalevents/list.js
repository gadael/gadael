'use strict';


const requestdateparams = require('../../../../modules/requestdateparams');
const periodCriterion = require('../../../../modules/periodcriterion');

/**
 * The personal events list service
 */




/**
 * Get regular event by applying the date filter
 * And rrule events by calling the expand on the events
 *
 * @param {listItemsService} service
 * @param {array} params      query parameters if called by controller
 *
 * @return {Promise}
 */
function getEvents(service, params)
{


    var find = service.app.db.models.CalendarEvent.find();

    if (undefined === params.user) {
        return Promise.reject(new Error('The user parameter is mandatory in the personalevents service'));
    }

    if (undefined === params.status) {
        params.status = ['TENTATIVE', 'CONFIRMED', 'PRECANCEL'];
    }

    find.where('user.id').equals(params.user);
    find.where('status').in(params.status);
    periodCriterion(find, params.dtstart, params.dtend);

    find.populate('absenceElem');
    find.populate('request');

    return find.exec();
}



function mapUid(docs) {

    var objects = docs.map(function(event) {
        event = event.toObject();
        if (undefined === event.uid || null === event.uid || '' === event.uid) {
            event.uid = event._id;
        }

        return event;
    });

    return Promise.resolve(objects);
}



/**
 * Create the service
 * @param   {Object} services
 * @param   {Object} app
 * @returns {listItemsService}
 */
exports = module.exports = function(services, app) {


    var service = new services.list(app);

    /**
     * Call the personal events list service
     *
     *
     * @param {Object} params
     *                      params.dtstart                  search interval start
     *                      params.dtend                    serach interval end
     *                      params.user                     user ID to search in
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        var checkParams = requestdateparams(app);

        if (!checkParams(service, params)) {
            return service.deferred.promise;
        }

        getEvents(service, params)
        .then(mapUid)
        .then(service.deferred.resolve)
        .catch(service.error);


        return service.deferred.promise;
    };


    return service;
};

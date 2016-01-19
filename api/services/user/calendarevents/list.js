'use strict';


/**
 * The calendar events list service
 */


function addDatesCriterion(find, params)
{
    var periodCriterion = require('../../../../modules/periodcriterion');
    periodCriterion(find, params.dtstart, params.dtend);

}


/**
 * Get regular event by applying the date filter
 * And rrule events by calling the expand on the events
 * 
 * @param {listItemsService} service
 * @param {array} calendarIds
 *
 * @return {Query}
 */
function getEventsQuery(service, dtstart, dtend, calendarIds)
{
    var find = service.app.db.models.CalendarEvent.find();

    find.where('calendar').in(calendarIds);

    addDatesCriterion(find, {
        dtstart: dtstart,
        dtend: dtend
    });

    
    return find;
}



function getAccount(service, userId)
{
    var find = service.app.db.models.Account.findOne();
    find.where('user.id', userId);

    return find.exec();
}






function getTypeCalendar(service, type)
{
    var find = service.app.db.models.Calendar.find();
    find.where('type', type);
    return find.exec();
}







/**
 * Create the service
 * @param   {Object} services
 * @param   {Object} app
 * @returns {listItemsService}
 */
exports = module.exports = function(services, app) {

    var Q = require('q');
    var service = new services.list(app);
    
    /**
     * Call the calendar events list service
     * the result events will be intersected with the serach interval
     * 
     * @param {Object} params
     *                      params.dtstart                  search interval start
     *                      params.dtend                    search interval end
     *                      params.type                     workschedule|nonworkingday|holiday
     *                      params.substractNonWorkingDays  substract non working days periods
     *                      params.substractPersonalEvents  substract personal events
     *                      params.subtractException       Array of personal event ID to ignore in the personal events to substract
     *
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        
        var getExpandedEra = require('../../../../modules/getExpandedEra');

        /**
         * get personal events to substract
         * @return {Promise} Era
         */
        function getPersonalEvents()
        {
            var deferred = Q.defer();

            if (undefined === params.user) {
                deferred.reject('the user param is mandatory if substractPersonalEvents is used');
            } else {

                var filter = {
                    'user.id': params.user,
                    status: { $in: ['TENTATIVE', 'CONFIRMED'] }
                };

                if (undefined !== params.subtractException) {

                    // Do not substract those personnal events
                    // because this is the events to update with selection
                    // the others personal events will be substracted from working hours
                    if (params.subtractException instanceof Array) {
                        filter._id = { $nin: params.subtractException };
                    } else {
                        filter._id = { $ne: params.subtractException };
                    }
                }

                var find = service.app.db.models.CalendarEvent.find(filter);
                addDatesCriterion(find, params);

                find.exec(function(err, docs) {
                    if (err) {
                        return deferred.reject(err);
                    }

                    var dtstart = new Date(params.dtstart);
                    var dtend = new Date(params.dtend);

                    deferred.resolve(getExpandedEra(docs, dtstart, dtend));
                });
            }

            return deferred.promise;
        }



        /**
         * get era with expanded events from all calendars of a type
         * @param {string} type
         * @param {Date} dtstart
         * @param {Date} dtend
         * @return {Promise}
         */
        function getEventsTypeEra(type, dtstart, dtend)
        {
            var deferred = Q.defer();

            getTypeCalendar(service, type).then(function(calendars) {
                var calId = calendars.map(function(cal) {
                    return cal._id;
                });

                getEventsQuery(service, dtstart, dtend, calId).exec(function(err, docs) {
                    deferred.resolve(getExpandedEra(docs, dtstart, dtend));
                });
            }, deferred.reject);

            return deferred.promise;
        }

        

        /**
         * @return {Promise}
         */
        function getEraFromType(account, dtstart, dtend, type)
        {
            switch(type) {

                case 'workschedule':
                    return account.getPeriodScheduleEvents(dtstart, dtend);

                case 'holiday':
                case 'nonworkingday':
                    return getEventsTypeEra(type, dtstart, dtend);

            }

            return Q.fcall(function () {
                throw new Error('Unexpected type');
            });
        }


        /**
         * @return {Promise}
         */
        function substractNonWorkingDays(era)
        {
            var deferred = Q.defer();


            if (undefined === params.substractNonWorkingDays || false === params.substractNonWorkingDays) {
                deferred.resolve(era);
                return deferred.promise;
            }

            getEventsTypeEra('nonworkingday', params.dtstart, params.dtend).then(function(nwEra) {
                deferred.resolve(era.subtractEra(nwEra));
            });


            return deferred.promise;
        }


        function substractPersonalEvents(era)
        {
            var deferred = Q.defer();


            if (undefined === params.substractPersonalEvents || false === params.substractPersonalEvents) {
                deferred.resolve(era);
                return deferred.promise;
            }

            getPersonalEvents().then(function(eventsEra) {
                deferred.resolve(era.subtractEra(eventsEra));
            }, deferred.reject);


            return deferred.promise;
        }





        /**
         * @return {boolean}
         */
        function checkParams() {
            var checkDateParams = require('../../../../modules/requestdateparams');

            if (!checkDateParams(service, params)) {
                return false;
            }

            if (undefined === params.type) {
                service.forbidden('The type parameter is mandatory');
                return false;
            }

            return true;
        }


        if (!checkParams()) {
            return service.deferred.promise;
        }


        getAccount(service, params.user).then(function(account) {


            getEraFromType(account, params.dtstart, params.dtend, params.type)
                .then(substractNonWorkingDays)
                .then(substractPersonalEvents)
                .then(function(era) {
                    service.mongOutcome(null, era.periods);
                })
                .catch(service.error);

        }, service.error);


        
        return service.deferred.promise;
    };
    
    
    return service;
};





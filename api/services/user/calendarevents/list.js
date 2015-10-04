'use strict';


/**
 * The calendar events list service
 */


function addDatesCriterion(find, params)
{
     find.or([
        { rrule: { $exists: true } },
        { $and:
            [
                { rrule: { $exists: false } },
                { dtend: { $gt: params.dtstart } },
                { dtstart: { $lt: params.dtend } }
            ]
        }
    ]);
}


/**
 * Get regular event by applying the date filter
 * And rrule events by calling the expand on the events
 * 
 * @param {listItemsService} service
 * @param {array} params      query parameters if called by controller
 *
 * @return {Query}
 */
function getEventsQuery(service, params)
{
    var find = service.app.db.models.CalendarEvent.find();

    if (params.calendar) {
        if (params.calendar instanceof Array) {
            find.where('calendar').in(params.calendar);
        } else {
            find.where('calendar').equals(params.calendar);
        }
    }

    if (params.user) {
        find.where('user.id').equals(params.user);   
    }

    addDatesCriterion(find, params);

    
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
     *                      params.calendar                 DEPRECATED
     *                      params.type                     workschedule|nonworkingday|holiday
     *                      params.substractNonWorkingDays  substract non working days periods
     *                      params.substractPersonalEvents  substract personal events
     *                      params.substractException       Array of personal event ID to ignore in the personal events to substract
     *                      params.user                     User ID for personal events
     *
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        
        var jurassic = require('jurassic');




        /**
         * Get Era from a list onf events documents
         * events will be expanded according to RRULE if any
         *
         *
         * @param {Array} docs
         * @return {Era}
         */
        function getExpandedEra(docs)
        {

            var events = new jurassic.Era();
            var expanded;


            // it seam that the expand method is based on the event start date
            // we get one more day to get the event overlapping with start search date
            var expandStart = new Date(params.dtstart);
            expandStart.setDate(expandStart.getDate() -1);

            for(var i =0; i<docs.length; i++) {

                expanded = docs[i].expand(expandStart, params.dtend);

                // expand event if RRULE
                for(var e =0; e<expanded.length; e++) {

                    // copy properties of expanded event to the jurassic period
                    events.addPeriod(expanded[e]);
                }
            }
            return events;
        }

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

                if (undefined !== params.substractException) {
                    // Do not substract those personnal events
                    // because this is the events to update with selection
                    // the others personal events will be substracted from working hours
                    filter._id = { $ne: params.substractException };
                }

                var find = service.app.db.models.CalendarEvent.find(filter);
                addDatesCriterion(find, params);

                find.exec(function(err, docs) {
                    if (err) {
                        return deferred.reject(err);
                    }


                    deferred.resolve(getExpandedEra(docs));
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

                getEventsQuery(service, {
                    dtstart: dtstart,
                    dtend: dtend,
                    calendar: calId
                }).exec(function(err, docs) {
                    deferred.resolve(getExpandedEra(docs));
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

                case 'personal':
                    return getPersonalEvents();

                case 'workschedule':
                    return account.getPeriodScheduleEvents(dtstart, dtend);

                case 'holiday':
                case 'nonworkingday':
                    return getEventsTypeEra(type, dtstart, dtend);
            }

            throw new Error('Unexpected type');
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
                deferred.resolve(era.substractEra(nwEra));
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
                deferred.resolve(era.substractEra(eventsEra));
            });


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

            var CalendarModel = service.app.db.models.Calendar;
            if (-1 === CalendarModel.schema.path('type').enumValues.indexOf(params.type)) {
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





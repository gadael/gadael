


/**
 * The calendar events list service
 */




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
    'use strict';

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
    
    return find;
}


/**
 * @return {Promise} resolve to schedule calendar object
 */
function getScheduleCalendar(service, calendar)
{
    'use strict';

    var find = service.app.db.models.CalendarEvent.findOne(calendar);
    return find.exec();
}



function getNonWorkingDaysCalendar(service)
{
    'use strict';

    var find = service.app.db.models.Calendar.find();
    find.where('type', 'nonworkingday');
    return find.exec();
}







/**
 * Create the service
 * @param   {Object} services
 * @param   {Object} app
 * @returns {listItemsService}
 */
exports = module.exports = function(services, app) {
    
    'use strict';

    var service = new services.list(app);
    
    /**
     * Call the calendar events list service
     * the result events will be intersected with the serach interval
     * 
     * @param {Object} params
     *                      params.dtstart                  search interval start
     *                      params.dtend                    serach interval end
     *                      params.calendar                 carlendar ID to search in
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
         * Create period from event
         * @param {Object}  obj     expanded event
         * @return {Period}
         */
        function createPeriod(obj)
        {
            var period = new jurassic.Period();
            for(var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    period[prop] = obj[prop];
                }
            }
            return period;
        }






        /**
         * Get Era from a list onf events documents
         * events will be expanded according to RRULE if any
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
                    events.addPeriod(createPeriod(expanded[e]));
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
            var Q = require('q');
            var deferred = Q.defer();

            if (undefined === params.user) {
                deferred.reject('the user param is mandatory if substractPersonalEvents is used');
            } else {

                var filter = {
                    dtstart: params.dtstart,
                    dtend: params.dtend,
                    user: params.user,
                    status: { $in: ['TENTATIVE', 'CONFIRMED'] }
                };

                if (undefined !== params.substractException) {
                    // Do not substract those personnal events
                    // because this is the events to update with selection
                    // the others personal events will be substracted from working hours
                    filter._id = { $nin: params.substractException };
                }

                getEventsQuery(service, filter).exec(function(err, docs) {
                    if (err) {
                        return deferred.reject(err);
                    }

                    deferred.resolve(getExpandedEra(docs));
                });
            }

            return deferred.promise;
        }

        
        var checkParams = require('../../../../modules/requestdateparams');
        
        if (!checkParams(service, params)) {
            return service.deferred.promise;   
        }
        
        getScheduleCalendar(service, params.calendar).then(function(scheduleCalendar) {

            getEventsQuery(service, {
                dtstart: params.dtstart,
                dtend: params.dtend,
                calendar: params.calendar
            }).exec(function(err, docs) {

                var searchPeriod = new jurassic.Period();
                searchPeriod.dtstart = params.dtstart;
                searchPeriod.dtend = params.dtend;

                var events = getExpandedEra(docs);
                var era = events.intersectPeriod(searchPeriod);

                for(var j =0; j<era.periods.length; j++) {

                    // we add the duration in days in a new property for json output
                    era.periods[j].businessDays = era.periods[j].getBusinessDays(scheduleCalendar.halfDayHour);
                }

                if (undefined === params.substractNonWorkingDays || false === params.substractNonWorkingDays) {
                    return service.mongOutcome(err, era.periods);
                }



                getNonWorkingDaysCalendar(service).then(function(nwdCalendars) {
                    var nwdCalId = nwdCalendars.map(function(cal) {
                        return cal._id;
                    });

                    getEventsQuery(service, {
                        dtstart: params.dtstart,
                        dtend: params.dtend,
                        calendar: nwdCalId
                    }).exec(function(err, docs) {

                        var nonWorkingDays = getExpandedEra(docs);
                        var NWera = nonWorkingDays.intersectPeriod(searchPeriod);
                        var substracted = era.substractEra(NWera);

                        if (undefined === params.substractPersonalEvents || false === params.substractPersonalEvents) {
                            return service.mongOutcome(err, substracted.periods);
                        }

                        getPersonalEvents().then(function(personalEra) {
                            substracted = substracted.substractEra(personalEra);
                            service.mongOutcome(err, substracted.periods);
                        });

                    });
                }, service.error);

            });

        }, service.error);


        
        return service.deferred.promise;
    };
    
    
    return service;
};





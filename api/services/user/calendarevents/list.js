


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
    /*
    if (params.user) {
        find.where('user.id').equals(params.user);   
    }
    */
    
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
     *                      params.dtstart  search interval start
     *                      params.dtend    serach interval end
     *                      params.calendar carlendar ID to serach in
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


        params.dtstart = new Date(params.dtstart);
        params.dtend = new Date(params.dtend);
        
        var checkParams = require('../../../../modules/requestdateparams');
        
        if (!checkParams(service, params)) {
            return service.deferred.promise;   
        }
        
        getScheduleCalendar(service, params.calendar).then(function(scheduleCalendar) {

            getEventsQuery(service, params).exec(function(err, docs) {

                var searchPeriod = new jurassic.Period();
                searchPeriod.dtstart = params.dtstart;
                searchPeriod.dtend = params.dtend;

                var events = getExpandedEra(docs);
                var era = events.intersectPeriod(searchPeriod);

                for(var j =0; j<era.periods.length; j++) {

                    // we add the duration in days in a new property for json output
                    era.periods[j].businessDays = era.periods[j].getBusinessDays(scheduleCalendar.halfDayHour);
                }

                if (undefined === params.extrudeNonWorkingDays || false === params.extrudeNonWorkingDays) {
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
                        service.mongOutcome(err, substracted.periods);
                    });
                }, service.error);

            });

        }, service.error);


        
        return service.deferred.promise;
    };
    
    
    return service;
};





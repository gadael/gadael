


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
        find.where('calendar').equals(params.calendar);   
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
        
        params.dtstart = new Date(params.dtstart);
        params.dtend = new Date(params.dtend);
        
        var checkParams = require('../../../../modules/requestdateparams');
        
        if (!checkParams(service, params)) {
            return service.deferred.promise;   
        }
        
        getScheduleCalendar(service, params.calendar).then(function(scheduleCalendar) {

            getEventsQuery(service, params).exec(function(err, docs) {

                var period, jurassic = require('jurassic');
                var searchPeriod = new jurassic.Period();
                var events = new jurassic.Era();
                var expanded;

                searchPeriod.dtstart = params.dtstart;
                searchPeriod.dtend = params.dtend;

                // it seam that the expand method is based on the event start date
                // we get one more day to get the event overlapping with start search date
                var expandStart = new Date(params.dtstart);
                expandStart.setDate(expandStart.getDate() -1);

                for(var i =0; i<docs.length; i++) {
                    expanded = docs[i].expand(expandStart, params.dtend);

                    for(var e =0; e<expanded.length; e++) {

                        // copy properties of expanded event to the jurassic period

                        period = new jurassic.Period();
                        for(var prop in expanded[e]) {
                            if (expanded[e].hasOwnProperty(prop)) {
                                period[prop] = expanded[e][prop];
                            }
                        }

                        events.addPeriod(period);
                    }

                }

                var era = events.intersectPeriod(searchPeriod);

                for(var j =0; j<era.periods.length; j++) {

                    // we add the duration in days in a new property for json output
                    era.periods[j].businessDays = era.periods[j].getBusinessDays(scheduleCalendar.halfDayHour);
                }

                service.mongOutcome(err, era.periods);

            });

        }, service.error);


        
        return service.deferred.promise;
    };
    
    
    return service;
};





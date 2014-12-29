'use strict';


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
    var find = service.app.db.models.CalendarEvent.find();

    if (params.calendar) {
        find.where('calendar').equals(params.calendar);   
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
 * Create the service
 * @param   {Object} services
 * @param   {Object} app
 * @returns {listItemsService}
 */
exports = module.exports = function(services, app) {
    
    var service = new services.list(app);
    
    /**
     * Call the calendar events list service
     * 
     * @param {Object} params
     * 
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
        
        getEventsQuery(service, params).exec(function(err, docs) {

            var events = [];
            
            for(var i =0; i<docs.length; i++) {
                events = events.concat(docs[i].expand(params.dtstart, params.dtend));
            }
            
            service.mongOutcome(err, events);
        
        });
        
        return service.deferred.promise;
    };
    
    
    return service;
};





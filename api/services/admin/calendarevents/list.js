'use strict';


/**
 * The Admin calendar events list service
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
    var find = service.models.CalendarEvent.find();
    
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
    service.call = function(params) {
        
        getEventsQuery(service. params).exec(function(err, docs) {
        
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





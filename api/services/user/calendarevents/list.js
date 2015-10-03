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






function getNonWorkingDaysCalendar(service)
{
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
            var Q = require('q');
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

        
        var checkParams = require('../../../../modules/requestdateparams');
        
        if (!checkParams(service, params)) {
            return service.deferred.promise;   
        }
        
        getAccount(service, params.user).then(function(account) {

            account.getPeriodScheduleEvents(params.dtstart, params.dtend).then(function(era) {

                if (undefined === params.substractNonWorkingDays || false === params.substractNonWorkingDays) {
                    return service.mongOutcome(null, era.periods);
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
                        var substracted = era.substractEra(nonWorkingDays);

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





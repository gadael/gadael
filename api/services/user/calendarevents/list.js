'use strict';

const requestdateparams = require('../../../../modules/requestdateparams');
const periodCriterion = require('../../../../modules/periodcriterion');

/**
 * The calendar events list service
 */


function addDatesCriterion(find, params)
{
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

    var service = new services.list(app);

    /**
     * Call the calendar events list service
     * the result events will be intersected with the serach interval
     *
     * @param {Object} params
     *                      params.user                     user ID for admin rest service, in account rest service the user param is set from session
     *                      params.dtstart                  search interval start
     *                      params.dtend                    search interval end
     *                      params.type                     workschedule|nonworkingday|holiday
     *                      params.subtractNonWorkingDays  subtract non working days periods
     *                      params.subtractPersonalEvents  subtract personal events
     *                      params.subtractException       Array of personal event ID to ignore in the personal events to subtract
     *
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        var getExpandedEra = require('../../../../modules/getExpandedEra');

        /**
         * get personal events to subtract
         * @return {Promise} Era
         */
        function getPersonalEvents()
        {

            if (undefined === params.user) {
                return Promise.reject('the user param is mandatory if subtractPersonalEvents is used');
            }

            let filter = {
                'user.id': params.user,
                status: { $in: ['TENTATIVE', 'CONFIRMED'] }
            };

            if (undefined !== params.subtractException) {

                // Do not subtract those personnal events
                // because this is the events to update with selection
                // the others personal events will be subtracted from working hours
                if (params.subtractException instanceof Array) {
                    filter._id = { $nin: params.subtractException };
                } else {
                    filter._id = { $ne: params.subtractException };
                }
            }

            var find = service.app.db.models.CalendarEvent.find(filter);
            addDatesCriterion(find, params);

            return find.exec()
            .then(function(docs) {

                var dtstart = new Date(params.dtstart);
                var dtend = new Date(params.dtend);

                return getExpandedEra(docs, dtstart, dtend);
            });
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

            return getTypeCalendar(service, type)
            .then(calendars => {
                var calId = calendars.map(cal => {
                    return cal._id;
                });

                return getEventsQuery(service, dtstart, dtend, calId).exec();
            })
            .then(docs => {
                return getExpandedEra(docs, dtstart, dtend);
            });
        }



        /**
         * @return {Promise}
         */
        function getEraFromType(account, dtstart, dtend, type)
        {
            switch(type) {

                case 'workschedule':
                    return account.getPeriodScheduleEvents(dtstart, dtend);

                case 'nonworkingday':
                    return account.getNonWorkingDayEvents(dtstart, dtend);

                case 'holiday':
                    return getEventsTypeEra(type, dtstart, dtend);

            }

            return Promise.reject(new Error('Unexpected type'));
        }




        /**
         * [[Description]]
         * @param   {Era} era [[Description]]
         * @returns {Promise} [[Description]]
         */
        function subtractPersonalEvents(era)
        {

            if (undefined === params.subtractPersonalEvents || false === params.subtractPersonalEvents || 'false' === params.subtractPersonalEvents) {
                return Promise.resolve(era);
            }

            return getPersonalEvents()
            .then(eventsEra => {
                return era.subtractEra(eventsEra);
            });
        }





        /**
         * @return {boolean}
         */
        function checkParams() {
            var checkDateParams = requestdateparams(app);

            if (!checkDateParams(service, params)) {
                return false;
            }

            if (undefined === params.type) {
                service.error('The type parameter is mandatory');
                return false;
            }

            if (undefined === params.user && 'workschedule' === params.type) {
                service.forbidden('The user parameter is mandatory for the workschedule type');
                return false;
            }

            if (undefined === params.user && 'nonworkingday' === params.type) {
                service.forbidden('The user parameter is mandatory for the workschedule type');
                return false;
            }

            return true;
        }


        if (!checkParams()) {
            return service.deferred.promise;
        }


        getAccount(service, params.user)
        .then(account => {


            /**
             * @return {Promise}
             */
            function subtractNonWorkingDays(era)
            {
                if (undefined === params.subtractNonWorkingDays || false === params.subtractNonWorkingDays || 'false' === params.subtractNonWorkingDays) {
                    return Promise.resolve(era);
                }

                return getEraFromType(account, params.dtstart, params.dtend, 'nonworkingday')
                .then(function(nwEra) {
                    return era.subtractEra(nwEra);
                });
            }

            // account can be null if params.type=holiday
            return getEraFromType(account, params.dtstart, params.dtend, params.type)
                .then(subtractNonWorkingDays)
                .then(subtractPersonalEvents);
        })
        .then(era => {
            service.mongOutcome(null, era.periods);
        })
        .catch(service.error);



        return service.deferred.promise;
    };


    return service;
};

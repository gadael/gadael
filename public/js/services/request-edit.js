define(['momentDurationFormat', 'q'], function(moment, Q) {

    'use strict';






    /**
     * Duration in milliseconds updated on every period changes
     * @var {int}
     */
    var duration = 0;

    /**
     * Duration in days updated on every period changes
     * @var {Number}
     */
    var businessDays = 0;







    /**
     * Set a duration visible to the final user
     *
     * @param {object} $scope
     * @param {Int} duration        Number of milliseconds
     * @param {Number} businessDays Number of days
     */
    function setDuration($scope, duration, businessDays)
    {
        var momentMs = moment.duration(duration, "milliseconds");
        var momentDays = moment.duration(businessDays, "days");

        $scope.selection.duration = duration;
        $scope.selection.days = momentDays.format("d [days]", 1);
        $scope.selection.hours = momentMs.format("h [hours]", 2);

        $scope.selection.isValid = duration > 0;
    }









    // Service to edit an absence,
    // shared by account/request/absence-edit and admin/request/absence-edit

    return {

        /**
         * Get duration as string
         * @param {Number} days
         * @param {Number} hours
         * @return {String}
         */
        getDuration: function getDuration(days, hours)
        {
            var disp = [];

            if (days !== 0) {
                var momentDays = moment.duration(days, "days");
                disp.push(momentDays.format("d [days]", 1));
            }

            if (hours !== 0) {
                var momentHours = moment.duration(hours, "hours");
                disp.push(momentHours.format("h [hours]", 2));
            }

            return disp.join(', ');
        },

        /**
         * Set scope delfault values
         * @param {Object} $scope
         */
        initScope: function initScope($scope) {
            // default values
            $scope.periodSelection = true;
            $scope.assignments = false;
            $scope.newRequest = false;
            $scope.editRequest = false;

            // list of beneficiaries objects, populated once period set
            $scope.accountRights = [];

            $scope.selection = {
                begin: undefined,
                end: undefined,
                isValid: false,
                duration: undefined,
                days: undefined,
                hours: undefined
            };


        },


        /**
         * Set a selection object from request data
         *
         */
        setSelectionFromRequest: function setSelectionFromRequest($scope) {

            var events = $scope.request.events;

            $scope.selection.begin = events[0].dtstart;
            $scope.selection.end = events[events.length-1].dtend;
            $scope.selection.periods = $scope.request.events;


            var us = 0, businessDays =0;

            events.forEach(function(evt) {
                if (undefined === evt.businessDays) {
                    throw new Error('events in selection must contain the businessDays property');
                }

                us += evt.dtend.getTime() - evt.dtstart.getTime();
                businessDays += evt.businessDays;

            });


            setDuration($scope, duration, businessDays);

        },






        /**
         * Process scope once the user document is available
         * @param   {Object}   $scope
         * @param   {Object}   user           user document as object
         * @param   {Resource} calendarEvents
         *
         */
        onceUserLoaded: function onceUserLoaded($scope, user, calendarEvents)
        {



            /**
             * get the onUpdateInterval function
             * @param   {Object}   $scope
             * @param   {Object}   account        object from the Account schema (vacation account)
             * @param   {Resource} calendarEvents Resource for the REST service (user and admin will have differents resources)
             * @returns {function}
             */
            function getOnUpdateInterval($scope, account, calendarEvents) {



                /**
                 * Get notified if interval is modified
                 * @param {Date} begin
                 * @param {Date} end
                 */
                return function onUpdateInterval(begin, end)
                {
                    if (!begin || !end) {
                        return setDuration($scope, 0, 0);
                    }

                    if (begin >= end) {
                        return setDuration($scope, 0, 0);
                    }

                    duration = 0;
                    businessDays = 0;

                    calendarEvents.query({
                        type: 'workschedule',
                        dtstart: begin,
                        dtend: end
                    }).$promise.then(function(periods) {

                        var p;

                        for(var i=0; i<periods.length; i++) {

                            p = {
                                dtstart: new Date(periods[i].dtstart),
                                dtend: new Date(periods[i].dtend)
                            };

                            duration += p.dtend.getTime() - p.dtstart.getTime();

                            businessDays += periods[i].businessDays;
                        }

                        return setDuration($scope, duration, businessDays);
                    });
                };
            }


            var onUpdateInterval = getOnUpdateInterval($scope, user.roles.account, calendarEvents);

            $scope.$watch(function() { return $scope.selection.begin; }, function(begin) {
                onUpdateInterval(begin, $scope.selection.end);
            });

            $scope.$watch(function() { return $scope.selection.end; }, function(end) {
                onUpdateInterval($scope.selection.begin, end);
            });

        },






        getLoadPersonalEvents: function(userPromise, personalEvents) {
            return function(interval) {

                var deferred = Q.defer();

                userPromise.then(function(user) {

                    personalEvents.query({
                        user: user._id,
                        dtstart: interval.from,
                        dtend: interval.to
                    }).$promise.then(deferred.resolve);
                });

                return deferred.promise;
            };
        },



        /**
         * Get period picker callback for non working days
         * @param {Resource} calendars
         * @param {Resource} calendarEvents
         * @return function
         */
        getLoadNonWorkingDaysEvents: function(calendars, calendarEvents) {
            return function(interval) {

                return calendarEvents.query({
                    type: 'nonworkingday',
                    dtstart: interval.from,
                    dtend: interval.to
                }).$promise;
            };
        },


        getLoadEvents: function(userPromise, personalEvents, calendars, calendarEvents) {

            var loadPersonalEvents = this.getLoadPersonalEvents(userPromise, personalEvents);
            var loadNonWorkingDaysEvents = this.getLoadNonWorkingDaysEvents(calendars, calendarEvents);



            return  function getLoadEvents(interval) {
                var deferred = Q.defer();
                var promises = [];

                promises.push(loadPersonalEvents(interval));
                promises.push(loadNonWorkingDaysEvents(interval));

                Q.all(promises).then(function(arr) {
                    deferred.resolve(arr[0].concat(arr[1]));
                }, deferred.reject);

                return deferred.promise;
            };
        },


        /**
         * Get period picker callback for scholar holidays
         */
        getLoadScholarHolidays: function(calendars, calendarEvents) {
            return function(interval) {

                return calendarEvents.query({
                    type: 'holiday',
                    dtstart: interval.from,
                    dtend: interval.to
                }).$promise;
            };
        },




    };
});

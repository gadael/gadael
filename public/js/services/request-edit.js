define(['angular', 'moment', 'momentDurationFormat', 'q'],
    function(angular, moment, momentDuration, Q) {
    'use strict';
    momentDuration(moment);

    return function requestEdit(gettextCatalog) {
        /**
         * Duration in milliseconds updated on every period changes
         * @var {int}
         */
        var duration = 0;

        function getMomentPaterns(momentDays, momentHours)
        {
            var days = momentDays.format('d');
            var hours = momentHours.format('h');


            return {
                day: 'd ['+gettextCatalog.getPlural(days, 'day', 'days')+']',
                hour: 'h ['+gettextCatalog.getPlural(hours, 'hour', 'hours')+']'
            };
        }

        /**
         * Set a duration visible to the final user
         *
         * @param {object} $scope
         * @param {Int} duration        Number of milliseconds
         *
         */
        function setDuration($scope, duration)
        {
            var momentMs = moment.duration(duration, 'milliseconds');
            var momentDays = moment.duration($scope.selection.businessDays, 'days');

            var p = getMomentPaterns(momentDays, momentMs);

            $scope.selection.duration = duration;
            $scope.selection.days = momentDays.format(p.day, 1);
            $scope.selection.hours = momentMs.format(p.hour, 2);

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

                var momentDays = moment.duration(days, "days");
                var momentHours = moment.duration(hours, "hours");

                var p = getMomentPaterns(momentDays, momentHours);

                if (days !== 0) {

                    disp.push(momentDays.format(p.day, 1));
                }

                if (hours !== 0) {

                    disp.push(momentHours.format(p.hour, 2));
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
                $scope.selection.businessDays = 0;

                var us = 0;

                events.forEach(function(evt) {
                    if (undefined === evt.businessDays) {
                        throw new Error('events in selection must contain the businessDays property');
                    }

                    us += evt.dtend.getTime() - evt.dtstart.getTime();
                    $scope.selection.businessDays += evt.businessDays;

                });

                setDuration($scope, us);
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
                        duration = 0;
                        $scope.selection.businessDays = 0;


                        if (!begin || !end) {
                            return setDuration($scope, duration);
                        }

                        if (begin >= end) {
                            return setDuration($scope, duration);
                        }

                        if (!calendarEvents) {
                            duration = end.getTime() - begin.getTime();
                            $scope.selection.businessDays = duration / (3600000*8);
                            return setDuration($scope, duration);
                        }

                        var params = {
                            type: 'workschedule',
                            dtstart: begin,
                            dtend: end,
                            subtractNonWorkingDays: true,
                            subtractPersonalEvents: true
                        };

                        if (user) {
                            params.user = user._id;
                        }

                        if (angular.isArray($scope.request.events) && $scope.request.events.length > 0) {
                            params.subtractException = [];
                            $scope.request.events.forEach(function(personalEvent) {
                                params.subtractException.push(personalEvent._id);
                            });
                        }

                        calendarEvents.query(params).$promise.then(function(periods) {
                            var p;
                            duration = 0;
                            $scope.selection.businessDays = 0;

                            for(var i=0; i<periods.length; i++) {
                                if (undefined === periods[i].businessDays) {
                                    throw new Error('businessDays is not defined on period from '+periods[i].dtstart+' to '+periods[i].dtend+' (onUpdateInterval)');
                                }

                                p = {
                                    dtstart: new Date(periods[i].dtstart),
                                    dtend: new Date(periods[i].dtend)
                                };

                                duration += p.dtend.getTime() - p.dtstart.getTime();
                                $scope.selection.businessDays += periods[i].businessDays;
                            }

                            return setDuration($scope, duration);
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
                    return userPromise
                    .then(function(user) {
                        return personalEvents.query({
                            user: user._id,
                            dtstart: interval.from,
                            dtend: interval.to
                        }).$promise;
                    });
                };
            },

            /**
             * Get period picker callback for non working days
             * @param {Resource} calendars
             * @param {Resource} calendarEvents
             * @param {Promise} userPromise
             * @return function
             */
            getLoadNonWorkingDaysEvents: function(calendars, calendarEvents, userPromise) {
                return function(interval) {

                    return userPromise
                    .then(function(user) {

                        return calendarEvents.query({
                            type: 'nonworkingday',
                            dtstart: interval.from,
                            dtend: interval.to,
                            user: user._id
                        }).$promise;

                    })
                    .then(function(events) {
                        return events.map(function(evt) {
                            evt.categories = ['nonworking'];
                            return evt;
                        });
                    });
                };
            },

            getLoadEvents: function(userPromise, personalEvents, calendars, calendarEvents) {

                var loadPersonalEvents = this.getLoadPersonalEvents(userPromise, personalEvents);
                var loadNonWorkingDaysEvents = this.getLoadNonWorkingDaysEvents(calendars, calendarEvents, userPromise);

                return  function getLoadEvents(interval) {
                    var promises = [];
                    promises.push(loadPersonalEvents(interval));
                    promises.push(loadNonWorkingDaysEvents(interval));

                    return Q.all(promises)
                    .then(function(arr) {
                        return arr[0].concat(arr[1]);
                    });
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
    };
});

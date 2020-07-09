define(['moment'], function(moment) {
    'use strict';

    return function loadCalendarService($locale, $q, $routeParams) {

        /**
         * Object for calendar day
         */
        function Day(loopDate, monthStartDate)
        {
            this.label = loopDate.getDate();
            if (1 === this.label) {
                this.label = loopDate.toLocaleDateString($locale.id, {month: 'short', day: 'numeric'});
            }
            this.d = new Date(loopDate);
            this.workschedule = [];
            this.events = [];
            this.nonworkingday = [];
            this.monthStartDate = monthStartDate;

            var s = new Date(loopDate); s.setHours(0,0,0,0);
            var e = new Date(s);        e.setDate(e.getDate()+1);

            this.boundaries = {
                start: s,
                end: e
            };
        }

        Day.prototype.isAbsence = function()
        {
            return (this.events.length > 0);
        };

        Day.prototype.isScheduled = function()
        {
            return (this.workschedule.length > 0 && this.events.length === 0 && this.nonworkingday.length === 0);
        };

        Day.prototype.isNotScheduled = function()
        {
            return (this.workschedule.length === 0 && this.events.length === 0 && this.nonworkingday.length === 0);
        };

        Day.prototype.isNonWorkingDay = function()
        {
            return (this.nonworkingday.length > 0);
        };

        Day.prototype.isInMonth = function()
        {
            return this.d.getMonth() === this.monthStartDate.getMonth();
        };


        /**
         * Test if start date of the event is in day
         * @param {object} event
         * @return {boolean}
         */
        Day.prototype.isStart = function(event)
        {
            return (event.dtstart >= this.boundaries.start &&
                    event.dtstart < this.boundaries.end);
        };

        /**
         * Test if end date of the event is in day
         * @param {object} event
         * @return {boolean}
         */
        Day.prototype.isEnd = function(event)
        {
            return (event.dtend > this.boundaries.start &&
                    event.dtend <= this.boundaries.end);
        };



        /**
         * Add weeks lines to calendar
         */
        function addToCalendar(calendar, loopDate, endDate, startDate)
        {
            var weekprop, id, lastid, monthid;

            while (loopDate < endDate) {
                weekprop = moment(loopDate).format('GGGGW');

                if (undefined === calendar.keys[weekprop]) {
                    id = null;
                    lastid = null;

                    if (calendar.weeks.length > 0) {
                        lastid = calendar.weeks[calendar.weeks.length -1].id;
                    }

                    monthid = 'month'+loopDate.getFullYear()+loopDate.getMonth();
                    if (lastid !== monthid) {
                        id = monthid;
                    }

                    calendar.weeks.push({
                        label: moment(loopDate).format('WW'),
                        days: [],
                        id: id,
                        keys: {}
                    });

                    calendar.keys[weekprop] = calendar.weeks.length-1;
                }

                var weekkey = calendar.keys[weekprop];

                var day = new Day(loopDate, startDate);
                calendar.weeks[weekkey].days.push(day);

                var dayprop = 'day'+loopDate.getDate();
                calendar.weeks[weekkey].keys[dayprop] = calendar.weeks[weekkey].days.length -1;

                loopDate.setDate(loopDate.getDate()+1);
            }
        }

        function setMonday(mydate)
        {
            var d = mydate.getDay();
            var daysToAdd = 0;

            if (d === 0) { // sunday
                daysToAdd = -6;
            }

            if (d > 1) {
                daysToAdd = -1 * (d-1);
            }

            mydate.setDate(mydate.getDate() + daysToAdd);
        }

        /**
         * Add event to calendar
         * @param {Object} cal
         * @param {Object} event
         * @param {String} typeProperty     A property of the day object
         */
        function addEvent(cal, event, typeProperty)
        {
            function inEvents(events)
            {
                for (var i=0; i<events.length; i++) {
                    if (events[i]._id === event._id) {
                        // already loaded
                        return true;
                    }
                }

                return false;
            }

            var loopDate = new Date(event.dtstart);
            var endDate = new Date(event.dtend);
            var weekprop, weekkey, dayprop, daykey, day, events;

            while (loopDate < endDate) {
                weekprop = moment(loopDate).format('GGGGW');
                dayprop = 'day'+loopDate.getDate();

                if (undefined === cal.calendar.keys[weekprop]) {
                    console.log('Failed to add event to date because week is not loaded '+weekprop);
                    loopDate.setDate(loopDate.getDate()+1);
                    continue;
                }

                weekkey = cal.calendar.keys[weekprop];

                if (undefined === cal.calendar.weeks[weekkey]) {
                    throw new Error('Failed to get week from weekprop: '+weekprop+', weekkey='+weekkey+', number of weeks='+cal.calendar.weeks.length);
                }

                daykey = cal.calendar.weeks[weekkey].keys[dayprop];
                day  = cal.calendar.weeks[weekkey].days[daykey];
                events = day[typeProperty];


                if (!inEvents(events)) {
                    events.push(event);
                }

                loopDate.setDate(loopDate.getDate()+1);
            }


        }

        /**
         * Merge events of the same day and same request
         * @param {Array} events
         * @return {Array}
         */
        function mergeEvents(events)
        {
            var output = [];
            var days = {};

            for (var i=0; i<events.length; i++) {
                var event = events[i];

                if (!event.request || !event.request._id) {
                    // no request linked to event, ignore
                    output.push(event);
                    continue;
                }

                var d = event.dtstart.toDateString()+event.request._id;

                if (undefined === days[d]) {
                    days[d] = event;
                    output.push(event);
                } else {
                    if (days[d].dtstart > event.dtstart) {
                        days[d].dtstart = event.dtstart;
                    }

                    if (days[d].dtend < event.dtend) {
                        days[d].dtend = event.dtend;
                    }
                }
            }

            return output;
        }



        /**
         *
         * @param {object} [user]
         *
         * @return {Promise}
         */
        function addEvents(cal, fromDate, toDate, calendarEventsResource, personalEventsResource, user)
        {
            function admComp(params) {
                if (undefined !== user) {
                    params.user = user._id;
                }
                return params;
            }


            var deferred = $q.defer();


            var workscheduleEvents = calendarEventsResource.query(
                admComp({
                    dtstart: fromDate,
                    dtend: toDate,
                    type: 'workschedule'
                })
            );


            var nonworkingdaysEvents = calendarEventsResource.query(
                admComp({
                    dtstart: fromDate,
                    dtend: toDate,
                    type: 'nonworkingday'
                })
            );


            var personalEvents = personalEventsResource.query(
                admComp({
                    dtstart: fromDate,
                    dtend: toDate
                })
            );

            $q.all([
                workscheduleEvents.$promise,
                nonworkingdaysEvents.$promise,
                personalEvents.$promise
            ]).then(function() {

                mergeEvents(workscheduleEvents).forEach(function(event) {
                    addEvent(cal, event, 'workschedule');
                });

                mergeEvents(nonworkingdaysEvents).forEach(function(event) {
                    addEvent(cal, event, 'nonworkingday');
                });

                mergeEvents(personalEvents).forEach(function(event) {
                    addEvent(cal, event, 'events');
                });

                deferred.resolve(true);
            }, deferred.reject);

            return deferred.promise;

        }


        /**
         * @param {int} year
         * @param {int} month
         * @param calendarEventsResource
         * @param personalEventsResource
         * @param {object} [user]
         * @return {Object}
         */
        function createCalendar(year, month, calendarEventsResource, personalEventsResource, user) {

            var cal = {
                calendar: {
                    weeks: [],
                    keys: {}
                }
            };

            setMonthView(cal, new Date(year, month, 1), calendarEventsResource, personalEventsResource, user);

            return cal;
        }

        function getCalendarFirstDayInMonth(calendar) {
            var lastweek = calendar.weeks[0].days;
            var lastDate = new Date(lastweek[lastweek.length-1].d);
            lastDate.setDate(1);
            return lastDate;
        }

        function getWeeksOfMonth(dt) {
            function daysDifference(d0, d1) {
                var diff = new Date(+d1).setHours(12) - new Date(+d0).setHours(12);
                return Math.round(diff/8.64e7);
            }
            var year         = dt.getFullYear();
            var month_number = dt.getMonth();
            var firstOfMonth = new Date(year, month_number, 1);
            setMonday(firstOfMonth);
            var lastOfMonth  = new Date(year, month_number+1, 0);
            var used         = daysDifference(firstOfMonth, lastOfMonth) + 1;
            return Math.ceil(used / 7);
        }

        /**
         * refresh calendar object with number of weeks
         * @param {Object} cal
         * @param {Date} startDate
         * @param {Object} calendarEventsResource
         * @param {Object} personalEventsResource
         * @param {Object} [user]
         * @return {Promise}
         */
        function setMonthView(cal, startDate, calendarEventsResource, personalEventsResource, user) {

            var calendar = cal.calendar;
            calendar.weeks = [];
            calendar.keys = [];

            var loopDate = new Date(startDate);
            setMonday(loopDate);
            var endDate = new Date(loopDate);
            endDate.setDate(endDate.getDate() + (7 * getWeeksOfMonth(startDate)));
            addToCalendar(calendar, new Date(loopDate), endDate, startDate);

            return addEvents(cal, loopDate, endDate, calendarEventsResource, personalEventsResource, user);
        }



        /**
         * Initialize the Load more data function on scope, callback for the on scroll directive
         * @param {object} $scope [[Description]]
         */
        function initNextPrevious($scope, calendarEventsResource, personalEventsResource, requestsResource) {

            var year, month, now = new Date();
            var routeSet = false;


            if (undefined !== $routeParams.year) {
                year = parseInt($routeParams.year, 10);
                routeSet = true;
            } else {
                year = now.getFullYear();
            }

            if (undefined !== $routeParams.month) {
                month = parseInt($routeParams.month, 10);
                routeSet = true;
            } else {
                month = now.getMonth();
            }

            $scope.titleDate = new Date(year, month, 1);
            $scope.cal = createCalendar(year, month, calendarEventsResource, personalEventsResource, $scope.user);
            $scope.isLoading = false;

            $scope.previousMonth = function previousMonth() {
                if (!$scope.isLoading) {
                    $scope.isLoading = true;
                    var startDate = getCalendarFirstDayInMonth($scope.cal.calendar);
                    startDate.setMonth(startDate.getMonth() - 1);
                    $scope.titleDate = startDate;
                    setMonthView($scope.cal, startDate, calendarEventsResource, personalEventsResource, $scope.user)
                    .then(function() {
                        $scope.isLoading = false;
                    }, function(error) {
                        $scope.isLoading = false;
                        throw error;
                    });
                }
            };

            $scope.nextMonth = function nextMonth() {
                if (!$scope.isLoading) {
                    $scope.isLoading = true;
                    var startDate = getCalendarFirstDayInMonth($scope.cal.calendar);
                    startDate.setMonth(startDate.getMonth() + 1);
                    $scope.titleDate = startDate;
                    setMonthView($scope.cal, startDate, calendarEventsResource, personalEventsResource, $scope.user)
                    .then(function() {
                        $scope.isLoading = false;
                    }, function(error) {
                        $scope.isLoading = false;
                        throw error;
                    });
                }
            };

            $scope.getRequest = function(request) {

                if (undefined === request || null === request) {
                    return null;
                }

                return requestsResource.get({ id: request._id });
            };

        }


        return {
            createCalendar: createCalendar,
            setMonthView: setMonthView,
            initNextPrevious: initNextPrevious
        };
    };

});

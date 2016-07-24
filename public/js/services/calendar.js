define(['moment', 'angular'], function(moment, angular) {

    'use strict';


    return function loadCalendarService($locale, $q, $routeParams, $scrollspy, $anchorScroll) {





        function Day(loopDate)
        {
            this.label = loopDate.getDate();
            if (1 === this.label) {
                this.label = loopDate.toLocaleDateString($locale.id, {month: 'short', day: 'numeric'});
            }
            this.d = new Date(loopDate);
            this.workschedule = [];
            this.events = [];
            this.nonworkingday = [];

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
            // TODO: check overlapping
        };

        Day.prototype.isNotScheduled = function()
        {
            return (this.workschedule.length === 0 && this.events.length === 0 && this.nonworkingday.length === 0);
        };

        Day.prototype.isNonWorkingDay = function()
        {
            return (this.nonworkingday.length > 0);
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
        function addToCalendar(calendar, loopDate, endDate)
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

                calendar.weeks[weekkey].days.push(new Day(loopDate));

                var dayprop = 'day'+loopDate.getDate();
                calendar.weeks[weekkey].keys[dayprop] = calendar.weeks[weekkey].days.length -1;

                loopDate.setDate(loopDate.getDate()+1);
            }
        }




        /**
         * Add months lines to left navigation
         */
        function addToNav(nav, loopDate, endDate)
        {
            while (loopDate < endDate) {


                var yearprop = loopDate.getFullYear();
                var monthprop = loopDate.getMonth();

                if (undefined === nav.keys[yearprop]) {
                    nav.years.push({
                        y: loopDate.getFullYear(),
                        months: [],
                        keys: {}
                    });

                    nav.keys[yearprop] = nav.years.length -1;
                }

                var yearkey = nav.keys[yearprop];

                if (undefined === nav.years[yearkey].keys[monthprop]) {

                    var label;

                    try {
                        label = loopDate.toLocaleDateString($locale.id, { month: 'long' });
                    } catch (e) {
                        label = loopDate.getMonth()+1;
                    }

                    nav.years[yearkey].months.push({
                        m: loopDate.getMonth(),
                        label: label
                    });

                    nav.years[yearkey].keys[monthprop] = nav.years[yearkey].months.length - 1;
                }

                loopDate.setMonth(loopDate.getMonth()+1);
            }
        }



        function setMonday(mydate)
        {
            var d = mydate.getDay();
            var daysToAdd = 0;

            if (d === 0) { // sunday
                daysToAdd = 1;
            }

            if (d > 1) {
                daysToAdd = -1 * (d-1);
            }

            mydate.setDate(mydate.getDate() + daysToAdd);
        }



        /**
         * Add event to nav
         * @param {Object} cal
         * @param {Object} event
         * @param {String} typeProperty     A property of the day object
         */
        function addEvent(cal, event, typeProperty)
        {
            var loopDate = new Date(event.dtstart);
            var endDate = new Date(event.dtend);
            var weekprop, weekkey, dayprop, daykey, day, events;

            while (loopDate < endDate) {
                weekprop = moment(loopDate).format('GGGGW');
                dayprop = 'day'+loopDate.getDate();

                if (undefined === cal.calendar.keys[weekprop]) {
                    console.log(event);
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

                events.push(event);

                loopDate.setDate(loopDate.getDate()+1);
            }


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

            // TODO: for the admin page, the requests will require an aditional user ID

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

                workscheduleEvents.forEach(function(event) {
                    addEvent(cal, event, 'workschedule');
                });

                nonworkingdaysEvents.forEach(function(event) {
                    addEvent(cal, event, 'nonworkingday');
                });

                personalEvents.forEach(function(event) {
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

            var nbWeeks = 50;
            var cal = {
                calendar: {
                    weeks: [],
                    keys: {}
                },
                nav: {
                    years: [],
                    keys: {}
                }
            };

            var loopDate = new Date(year, month -6, 1);
            setMonday(loopDate);


            var endDate = new Date(loopDate);
            endDate.setDate(endDate.getDate()+(7*nbWeeks));

            addToCalendar(cal.calendar, new Date(loopDate), endDate);
            addToNav(cal.nav, new Date(loopDate), endDate);

            addEvents(cal, loopDate, endDate, calendarEventsResource, personalEventsResource, user);

            return cal;
        }

        /**
         * update nav object with number of weeks
         * @param {Object} cal
         * @param {Integer} nbWeeks
         * @param {Object} calendarEventsResource
         * @param {Object} personalEventsResource
         * @param {Object} [user]
         * @return {Promise}
         */
        function addWeeks(cal, nbWeeks, calendarEventsResource, personalEventsResource, user) {

            var calendar = cal.calendar;
            var nav = cal.nav;

            var lastweek = calendar.weeks[calendar.weeks.length-1].days;

            var loopDate = new Date(lastweek[lastweek.length-1].d);
            loopDate.setDate(loopDate.getDate()+1);

            var endDate = new Date(loopDate);
            endDate.setDate(endDate.getDate()+(7*nbWeeks));

            addToCalendar(calendar, new Date(loopDate), endDate);
            addToNav(nav, new Date(loopDate), endDate);

            return addEvents(cal, loopDate, endDate, calendarEventsResource, personalEventsResource, user);
        }



        /**
         * Initialize the Load more data function on scope, callback for the on scroll directive
         * @param {object} $scope [[Description]]
         */
        function initLoadMoreData($scope, calendarEventsResource, personalEventsResource, requestsResource) {

            var year, month, now = new Date();

            if (undefined !== $routeParams.year) {
                year = parseInt($routeParams.year, 10);
            } else {
                year = now.getFullYear();
            }



            if (undefined !== $routeParams.month) {
                month = parseInt($routeParams.month, 10);
            } else {
                month = now.getMonth();
            }

            $scope.cal = createCalendar(year, month, calendarEventsResource, personalEventsResource, $scope.user);
            $scope.previousYear = $scope.cal.nav.years[0].y - 1;



            $scope.scrollTo = function(id) {
                $anchorScroll(id);
            };


            $scope.isLoading = false;

            $scope.loadMoreData = function loadMoreData() {
                if (!$scope.isLoading) {
                    $scope.isLoading = true;
                    addWeeks($scope.cal, 6, calendarEventsResource, personalEventsResource, $scope.user)
                    .then(function() {
                        $scope.isLoading = false;

                        // refresh scrollSpy
                        var scrollspy = $scrollspy(angular.element(document.getElementsByClassName('bs-sidenav')[0]), {});
                        scrollspy.init();

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
            addWeeks: addWeeks,
            initLoadMoreData: initLoadMoreData
        };
    };

});

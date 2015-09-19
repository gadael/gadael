define(['momentDurationFormat', 'q'], function(moment, Q) {

    'use strict';

    /**
     * store quantity_unit for each loaded right
     */
    var quantity_unit = {};

    var available = {};


    /**
     * Get duration as string
     * @param {Number} days
     * @param {Number} hours
     * @return {String}
     */
    function getDuration(days, hours)
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
    }



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
         * @return selection
         */
        setSelectionFromRequest: function setSelectionFromRequest($scope) {

            var events = $scope.request.events;

            $scope.selection.begin = events[0].dtstart;
            $scope.selection.end = events[events.length-1].dtend;
            $scope.selection.periods = events;

        },


        
        /**
         * The next button, from the period selection to the right distribution interface
         *
         * @param {object} $scope
         * @param {object} user
         * @param {Resource} accountRights
         */
        getNextButtonJob: function getNextButtonJob($scope, user, accountRights) {
            return function() {

                // hide the period selection
                $scope.periodSelection = false;

                // show the right assignement
                $scope.assignments = true;

                // TODO: init distribution if this is a request modification
                $scope.distribution = {
                    class: {},
                    right: {},
                    total: 0,
                    completed: false
                };

                /**
                 * Load accountRights
                 * the list of rights accessible on the selected period
                 */

                $scope.accountRights = accountRights.query({
                    user: user._id,
                    dtstart: $scope.selection.begin,
                    dtend: $scope.selection.end
                });

                $scope.accountRights.$promise.then(function(ar) {
                    // loaded

                    var days=0, hours=0;

                    for (var i=0; i<ar.length; i++) {

                        available[ar[i]._id] = ar[i].available_quantity;
                        quantity_unit[ar[i]._id] = ar[i].quantity_unit;

                        switch (ar[i].quantity_unit) {
                            case 'D': days  += ar[i].available_quantity; break;
                            case 'H': hours += ar[i].available_quantity; break;
                        }
                    }

                    $scope.available = {
                        total: getDuration(days, hours)
                    };
                }, function(err) {
                    // TODO: redirect message to catchOutcome
                    alert(err.data.$outcome.alert[0].message);
                });

            };
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
                        calendar: account.currentScheduleCalendar._id, 
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
            
            
            if (!user.roles.account) {
                throw new Error('the user must have a vacation account'); 
            }

            /**
             * Get a classname for the input field
             * @param {Number} value
             * @param {Number} available
             * @param {Boolean} completed
             * @return string
             */
            function getValueClass(value, available, completed) {

                if (undefined === value || null === value) {
                    return '';
                }

                if (0 === value) {
                    return 'has-warning';
                }

                if (value < 0) {
                    return 'has-error';
                }

                if (available < value) {
                    return 'has-error';
                }

                if (!completed) {
                    return 'has-warning';
                }

                return 'has-success';
            }






            var onUpdateInterval = getOnUpdateInterval($scope, user.roles.account, calendarEvents);
            
            $scope.$watch(function() { return $scope.selection.begin; }, function(begin) {
                onUpdateInterval(begin, $scope.selection.end);
            });

            $scope.$watch(function() { return $scope.selection.end; }, function(end) {
                onUpdateInterval($scope.selection.begin, end);
            });

            $scope.$watch('distribution', function(distribution) {


                /**
                 * Browse the rights appliquable for distribution
                 * @param {function} action     function to call on each rights
                 *
                 */
                function browseInputValue(action) {
                    for(var rightId in distribution.right) {
                        if (distribution.right.hasOwnProperty(rightId)) {
                            action(rightId);
                        }
                    }
                }


                /**
                 * Test if distribution is completed
                 * @param {Number} days     Sum of days distributed on rights
                 * @param {Number} hours    Sum of hours distributed on rights
                 *
                 * @return {Boolean}
                 */
                function isCompleted(days, hours) {
                    var daysCompleted = (businessDays === days) && !hours;
                    var hoursCompleted = (duration === (hours*360000)) && !days;
                    return (daysCompleted || hoursCompleted);
                }



                if (distribution === undefined) {
                    $scope.distribution = {
                        class: {},
                        right: {},
                        total: 0,
                        completed: false
                    };
                } else {


                    var value, days = 0, hours = 0;

                    // first pass, compute total
                    browseInputValue(function(rightId) {
                        var inputValue = distribution.right[rightId];
                        if (!inputValue) {
                            return;
                        }

                        value = parseFloat(inputValue);

                        switch(quantity_unit[rightId]) {
                            case 'D': days  += value; break;
                            case 'H': hours += value; break;
                        }
                    });


                    var completed = isCompleted(days, hours);
                    $scope.distribution.completed = completed;

                    // second pass, apply styles on cells
                    browseInputValue(function(rightId) {
                        var inputValue = distribution.right[rightId];
                        $scope.distribution.class[rightId] = getValueClass(inputValue, available[rightId], completed);
                    });

                    // Assigned duration to display to the user
                    distribution.total = getDuration(days, hours);
                }
            }, true);
        },



        /**
         * Get Period picker callback for working times
         * @param {Promise} userPromise
         * @param {Resource} calendarEvents
         * @param {Array} [personalEvents] Optional personal events list, the list of events curently modified
         * @return function
         */
        getLoadWorkingTimes: function(userPromise, calendarEvents, personalEvents) {

            return function(interval) {

                var deferred = Q.defer();

                userPromise.then(function(user) {
                    var account = user.roles.account;

                    if (!account.currentScheduleCalendar) {
                        deferred.reject('No valid schedule calendar');
                        return;
                    }

                    var queryParams = {
                        calendar: account.currentScheduleCalendar._id,
                        dtstart: interval.from,
                        dtend: interval.to,
                        substractNonWorkingDays: true,
                        substractPersonalEvents: true
                    };

                    if (undefined !== personalEvents) {
                        queryParams.substractException = [];
                        personalEvents.forEach(function(personalEvent) {
                            queryParams.substractException.push(personalEvent._id);
                        });
                    }

                    calendarEvents.query(queryParams).$promise.then(deferred.resolve);
                });

                return deferred.promise;
            };
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
                var deferred = Q.defer();

                calendars.query({
                    type: 'nonworkingday'
                }).$promise.then(function(nwdCalendars) {

                    var nwdCalId = nwdCalendars.map(function(cal) {
                        return cal._id;
                    });

                    calendarEvents.query({
                        calendar: nwdCalId,
                        dtstart: interval.from,
                        dtend: interval.to
                    }).$promise.then(deferred.resolve);
                });

                return deferred.promise;
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

                var deferred = Q.defer();

                calendars.query({
                    type: 'holiday'
                }).$promise.then(function(hCalendars) {

                    var hCalId = hCalendars.map(function(cal) {
                        return cal._id;
                    });

                    calendarEvents.query({
                        calendar: hCalId,
                        dtstart: interval.from,
                        dtend: interval.to
                    }).$promise.then(deferred.resolve);
                });

                return deferred.promise;
            };
        },


        /**
         * Create distribution to post for a absence request
         * @param {object} rights   Rights distribution with right id and quantity (the form input)
         * @param {object} periods  The list of selected periods, provided by the period picker widget
         * @return {Array}
         */
        createDistribution: function(rights, periods, accountRights) {


            var totalSeconds = 0;
            var totalDays = 0;

            for(var j=0; j<periods.length; j++) {
                totalDays += periods[j].businessDays;
                totalSeconds += (periods[j].dtend.getTime() - periods[j].dtstart.getTime()) / 1000;
            }


            /**
             * get the remainder quantity or the date in a period
             *
             * @param {object}  period      object with dtstart and dtend and businessDays
             * @param {Date}    from        start date in period
             * @param {Number}  secQuantity seconds to add to the from date
             *
             * @return {object} with properties:
             *      to: the next date in period
             *      remainder: the remaining quantity or 0, in seconds
             */
            function getLast(period, from, secQuantity)
            {
                if (isNaN(from.getTime())) {
                    throw new Error('invalid date');
                }

                if (isNaN(secQuantity)) {
                    throw new Error('invalid duration');
                }

                var to = new Date(from);
                to.setSeconds(to.getSeconds() + secQuantity);

                var remainder = 0;

                if (to.getTime() > period.dtend.getTime()) {
                    remainder = Math.round((to.getTime() - period.dtend.getTime()) / 1000);
                    to = period.dtend;
                }

                return {
                    to: to,
                    remainder: remainder
                };
            }

            /**
             * get the period from date, if date is a period start date, return the period
             * if date is not in a period, get the next period from date
             * @return {object}
             */
            function getPeriod(date)
            {
                for(var i=0; i<periods.length; i++) {
                    if (periods[i].dtstart.getTime() === date.getTime()) {
                        return periods[i];
                    }

                    if (periods[i].dtend > date) {
                        return periods[i];
                    }
                }

                return null;
            }


            /**
             * Get next date from quantity
             * @param {Date}    date            Origin
             * @param {Number}  secQuantity     User input converted to seconds
             *
             * @return {Date}
             */
            function getNextDate(date, secQuantity)
            {
                var next, period;

                do {
                    period = getPeriod(date);

                    if (null === period) {
                        throw new Error('Failed to get a period from '+date);
                    }

                    next = getLast(period, date, secQuantity);
                    date = next.to;
                    quantity = next.remainder;
                } while(quantity > 0);


                if (isNaN(date.getTime())) {
                    throw new Error('Invalid output for getNextDate');
                }

                return date;
            }


            /**
             * create event to embed in distribution
             * @param {Number} secQuantity
             * @param {Date} startDate
             * @return {object}
             */
            function createEvent(secQuantity, startDate)
            {
                var event = {
                    dtstart: startDate,
                    dtend: getNextDate(startDate, secQuantity)
                };


                return event;
            }

            /**
             * @return {String} D|H
             */
            function getQuantityUnit(rightId)
            {
                for(var i=0; i<accountRights.length; i++) {
                    if (accountRights[i]._id === rightId) {
                        return accountRights[i].quantity_unit;
                    }
                }

                throw new Error('Right not found in available accountRights');
            }


            /**
             * Get quantity in seconds
             * @param {String} rightId
             * @param {Number} inputQuantity
             * @return {Int}
             */
            function getSecQuantity(rightId, inputQuantity)
            {
                var u = getQuantityUnit(rightId);

                if ('H' === u) {
                    return Math.round(inputQuantity*3600);
                }

                if ('D' === u) {

                    if (0 === totalDays) {
                        throw new Error('Conversion not appliquable, totalDays must be greater than 0');
                    }

                    var days = (totalSeconds * inputQuantity / totalDays);
                    return days;
                }

                throw new Error('Invalid quantity unit');
            }


            var distribution = [];
            var startDate = periods[0].dtstart;
            var quantity, elem;



            for(var rightId in rights) {
                if (rights.hasOwnProperty(rightId)) {
                    quantity = rights[rightId];
                    elem = {
                        right: rightId,
                        quantity: quantity,
                        event: createEvent(getSecQuantity(rightId, quantity), startDate)
                    };

                    distribution.push(elem);
                    startDate = elem.event.dtend;
                }
            }

            return distribution;
        }

    };
});

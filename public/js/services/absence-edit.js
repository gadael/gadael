define(['momentDurationFormat', 'q'], function(moment, Q) {

    'use strict';

    /**
     * store quantity_unit for each loaded right
     */
    var quantity_unit = {};

    var available = {};


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




    /**
     * Callback used to watch the distribution object in scope
     * @param {object} distribution
     */
    function distributionWatch(distribution, $scope) {


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



        /**
         * Get a classname for the input field
         * @param {Number} value
         * @param {Number} availableQte
         * @param {Boolean} completed
         * @return string
         */
        function getValueClass(value, availableQte, completed) {

            if (undefined === value || null === value) {
                return '';
            }

            if (0 === value) {
                return 'has-warning';
            }

            if (value < 0) {
                return 'has-error';
            }

            if (availableQte < value) {
                return 'has-error';
            }

            if (!completed) {
                return 'has-warning';
            }

            return 'has-success';
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

            events.forEach(function(evt) {
                if (undefined === evt.businessDays) {
                    throw new Error('events in selection must contain the businessDays property');
                }
            });

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

                // init distribution if this is a request modification after accountRights.$promise
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

                    // load distribution if this is a request modification
                    if (undefined !== $scope.request.absence && $scope.request.absence.distribution.length > 0) {
                        $scope.request.absence.distribution.forEach(function(element) {
                            $scope.distribution.right[element.right.id] = element.quantity;
                        });

                        distributionWatch($scope.distribution, $scope);
                    }


                }, function(err) {
                    // TODO: display message is rootscope
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








            var onUpdateInterval = getOnUpdateInterval($scope, user.roles.account, calendarEvents);
            
            $scope.$watch(function() { return $scope.selection.begin; }, function(begin) {
                onUpdateInterval(begin, $scope.selection.end);
            });

            $scope.$watch(function() { return $scope.selection.end; }, function(end) {
                onUpdateInterval($scope.selection.begin, end);
            });





            $scope.$watch('distribution', function(distribution) {
                distributionWatch(distribution, $scope);
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

                var queryParams = {
                    type: 'workschedule',
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

                return calendarEvents.query(queryParams).$promise;
            };
        },


        getLoadPersonalEvents: function(userPromise, personalEvents) {
            return function(interval) {

                var deferred = Q.defer();

                userPromise.then(function(user) {

                    personalEvents.query({
                        type: 'personal',
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
                if (undefined === periods[j].businessDays) {
                    throw new Error('Missing businessDays on period from '+periods[j].dtstart+' to '+periods[j].dtend);
                }

                totalDays += periods[j].businessDays;
                totalSeconds += (periods[j].dtend.getTime() - periods[j].dtstart.getTime()) / 1000;
            }



            /**
             * @param {object} selectePeriod    selected working period
             * @param {Number} secQuantity      Duration for the element
             * @param {Date} startDate          Start date for the element
             *
             * @return {object}
             */
            function extractEvent(selectedPeriod, startDate, secQuantity)
            {
                if (selectedPeriod.dtend <= startDate) {
                    return null;
                }

                var endDate = new Date(startDate);
                endDate.setTime(endDate.getTime() + (1000* secQuantity));

                if (selectedPeriod.dtstart >= endDate) {
                    return null;
                }


                var dtstart = selectedPeriod.dtstart > startDate ? selectedPeriod.dtstart : startDate;
                var dtend = selectedPeriod.dtend < endDate ? selectedPeriod.dtend : endDate;

                return {
                    dtstart: dtstart,
                    dtend: dtend
                };
            }


            /**
             * create events to embed in distribution
             * One event per working period
             *
             * @param {Number} secQuantity      Duration for the element
             * @param {Date} startDate          Start date for the element
             * @return {array}
             */
            function createEvents(secQuantity, startDate)
            {

                var event, events = [];

                periods.forEach(function(selectedPeriod) {
                    event = extractEvent(selectedPeriod, startDate, secQuantity);
                    if (null !== event) {
                        events.push(event);

                        startDate = event.dtend;
                        secQuantity = secQuantity - Math.round((event.dtend.getTime() - event.dtstart.getTime())/1000);

                    }
                });

                return events;
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

                    if (0 === totalDays || isNaN(totalDays)) {
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
                        events: createEvents(getSecQuantity(rightId, quantity), startDate)
                    };

                    distribution.push(elem);

                    // set startDate for the next element
                    startDate = elem.events[elem.events.length-1].dtend;
                }
            }

            return distribution;
        }

    };
});

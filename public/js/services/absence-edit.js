define(['angular', 'momentDurationFormat', 'q', 'services/request-edit'], function(angular, moment, Q, RequestEdit) {

    'use strict';

    /**
     * store quantity_unit for each loaded right ID
     */
    var quantity_unit = {};


    /**
     * available quantity per renewal ID
     * @var {object}
     */
    var available = {};










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

            for(var renewalId in distribution.renewal) {
                if (distribution.renewal.hasOwnProperty(renewalId)) {
                    action(renewalId, distribution.renewal[renewalId].right);
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
            var daysCompleted = ($scope.selection.businessDays === days) && !hours;
            var hoursCompleted = ($scope.selection.duration === (hours*360000)) && !days;
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
                renewal: {},
                total: 0,
                completed: false
            };
        } else {


            var value, days = 0, hours = 0;

            // first pass, compute total
            browseInputValue(function(renewalId, rightId) {
                var inputValue = distribution.renewal[renewalId].quantity;
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
            browseInputValue(function(renewalId) {
                var inputValue = distribution.renewal[renewalId].quantity;
                $scope.distribution.class[renewalId] = getValueClass(inputValue, available[renewalId], completed);
            });

            // Assigned duration to display to the user
            distribution.total = RequestEdit.getDuration(days, hours);
        }
    }







    // Service to edit an absence, 
    // shared by account/request/absence-edit and admin/request/absence-edit
    
    return {
        
        initScope: RequestEdit.initScope,

        setSelectionFromRequest: RequestEdit.setSelectionFromRequest,

        getLoadPersonalEvents: RequestEdit.getLoadPersonalEvents,
        getLoadNonWorkingDaysEvents: RequestEdit.getLoadNonWorkingDaysEvents,
        getLoadEvents: RequestEdit.getLoadEvents,
        getLoadScholarHolidays: RequestEdit.getLoadScholarHolidays,

        



        
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
                    renewal: {},
                    total: 0,
                    completed: false
                };




                /**
                 * Load accountRights
                 * the list of rights accessible on the selected period
                 */

                $scope.accountRights = accountRights.query({
                    user: user._id, // need that if the request is created by the admin, ignored if created by the user
                    dtstart: $scope.selection.begin,
                    dtend: $scope.selection.end
                });



                function createAccountRenewal(item, renewalIndex)
                {
                    var accountRightRenewal = Object.create(item);
                    accountRightRenewal.renewal = item.renewals[renewalIndex];

                    $scope.distribution.renewal[accountRightRenewal.renewal._id] = {
                        quantity: null,
                        right: item._id
                    };

                    return accountRightRenewal;
                }




                $scope.getIcon = function(listItem) {
                    if (listItem.fold) {
                        return 'fa-minus-square';
                    } else {
                        return 'fa-plus-square';
                    }
                };




                $scope.accountRights.$promise.then(function(ar) {
                    // loaded

                    var days=0, hours=0;


                    function updateTotal(right, accountRightRenewal, groupAvailable) {
                        available[accountRightRenewal.renewal._id] = ar[i].available_quantity;
                        quantity_unit[accountRightRenewal._id] = ar[i].quantity_unit;

                        switch (accountRightRenewal.quantity_unit) {
                            case 'D':
                                groupAvailable.days  += accountRightRenewal.renewal.available_quantity;
                                days                 += accountRightRenewal.renewal.available_quantity;
                                break;

                            case 'H':
                                groupAvailable.hours += accountRightRenewal.renewal.available_quantity;
                                hours                += accountRightRenewal.renewal.available_quantity;
                                break;
                        }
                    }


                    // Group by types

                    var typesIndex = {};
                    $scope.types = [];
                    var accountRightRenewal;

                    for (var i=0; i<ar.length; i++) {

                        var type = ar[i].type;

                        if (ar[i].renewals.length > 0) {

                            if (undefined === typesIndex[type._id]) {
                                $scope.types.push({
                                    fold: !type.group,
                                    type: type,
                                    accountRightsRenewals: [],
                                    available: {
                                        days: 0,
                                        hours: 0
                                    }
                                });
                                typesIndex[type._id] = $scope.types.length-1;
                            }

                            for(var j=0; j<ar[i].renewals.length; j++) {
                                accountRightRenewal = createAccountRenewal(ar[i], j);
                                $scope.types[typesIndex[type._id]].accountRightsRenewals.push(accountRightRenewal);
                                updateTotal(ar[i], accountRightRenewal, $scope.types[typesIndex[type._id]].available);
                            }
                        }
                    }

                    // total on each type group

                    $scope.types.forEach(function(item) {
                        item.available.display = RequestEdit.getDuration(item.available.days, item.available.hours);
                    });


                    // grand total

                    $scope.available = {
                        total: RequestEdit.getDuration(days, hours)
                    };

                    // load distribution if this is a request modification
                    if (undefined !== $scope.request.absence && $scope.request.absence.distribution.length > 0) {
                        $scope.request.absence.distribution.forEach(function(element) {
                            $scope.distribution.renewal[element.right.renewal.id] = {
                                quantity: element.quantity,
                                right: element.right.id
                            };
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

            if (!user.roles.account) {
                throw new Error('the user must have a vacation account'); 
            }

            RequestEdit.onceUserLoaded($scope, user, calendarEvents);

            $scope.$watch('distribution', function(distribution) {
                distributionWatch(distribution, $scope);
            }, true);
        },



        /**
         * Get Period picker callback for working times
         * @param {Resource} calendarEvents
         * @param {Array} personalEventList personal events list, the list of events curently modified
         *
         * @return function
         */
        getLoadWorkingTimes: function(calendarEvents, personalEventList) {



            return function(interval) {



                var queryParams = {
                    type: 'workschedule',
                    dtstart: interval.from,
                    dtend: interval.to,
                    substractNonWorkingDays: true,
                    substractPersonalEvents: true
                };

                if (angular.isArray(personalEventList) && personalEventList.length > 0) {
                    queryParams.subtractException = [];
                    personalEventList.forEach(function(personalEvent) {
                        queryParams.subtractException.push(personalEvent._id);
                    });
                }

                return calendarEvents.query(queryParams).$promise;
            };
        },




        /**
         * Create distribution to post for a absence request
         * @param {object} renewals   Rights renenwals distribution with renewal id as property, right id and quantity (the form input) in the value
         * @param {object} periods    The list of selected periods, provided by the period picker widget
         * @return {Array}
         */
        createDistribution: function(renewals, periods, accountRights) {

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

                if (0 === events.length) {
                    throw new Error('Wrong events count for quantity='+secQuantity+' startDate='+startDate);
                }

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
                if (null === inputQuantity) {
                    throw new Error('Input quantity must be set');
                }

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
            var rightId, quantity, elem;



            for(var renewalId in renewals) {
                if (renewals.hasOwnProperty(renewalId)) {

                    quantity = renewals[renewalId].quantity;

                    if (undefined === quantity || null === quantity || 0 === quantity) {
                        continue;
                    }

                    rightId = renewals[renewalId].right;

                    elem = {
                        right: {
                            id: rightId,
                            renewal:renewalId
                        },
                        quantity: quantity,
                        events: createEvents(getSecQuantity(rightId, quantity), startDate)
                    };

                    distribution.push(elem);

                    // set startDate for the next element
                    startDate = elem.events[elem.events.length-1].dtend;
                }
            }

            if (0 === distribution.length) {
                throw new Error('Nothing to save');
            }

            return distribution;
        }

    };
});

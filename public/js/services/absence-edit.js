define(['angular', 'services/request-edit'], function(angular, loadRequestEdit) {
    'use strict';

    return function(gettextCatalog) {
        var RequestEdit = loadRequestEdit(gettextCatalog);

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
                var hoursCompleted = ($scope.selection.duration === (hours*3600000)) && !days;
                return (daysCompleted || hoursCompleted);
            }

            /**
             * Get a classname for the input field
             * @param {Number} value            Consumed quantity
             * @param {Number} availableQte
             * @param {Boolean} completed
             * @return string
             */
            function getValueClass(value, availableQte, completed) {

                if (undefined === value || null === value || null === availableQte) {
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


                var inputQuantity, days = 0, hours = 0, daysConsumed = 0, hoursConsumed = 0;

                // first pass, compute total
                browseInputValue(function(renewalId, rightId) {
                    var inputValue = distribution.renewal[renewalId].quantity;
                    if (!inputValue) {
                        return;
                    }

                    inputQuantity = parseFloat(inputValue);
                    var inputConsumption = distribution.renewal[renewalId].consumedQuantity;

                    switch(quantity_unit[rightId]) {
                        case 'D':
                            days  += inputQuantity;
                            daysConsumed += inputConsumption;
                            break;

                        case 'H':
                            hours += inputQuantity;
                            hoursConsumed += inputConsumption;
                            break;
                    }
                });


                var completed = isCompleted(days, hours);
                $scope.distribution.completed = completed;

                // second pass, apply styles on cells
                browseInputValue(function(renewalId) {
                    var consumedQuantity = distribution.renewal[renewalId].consumedQuantity;
                    var avail = available[renewalId];
                    if (null !== avail && undefined !== $scope.initialQuantity && undefined !== $scope.initialQuantity[renewalId]) {
                        avail = avail + $scope.initialQuantity[renewalId];
                    }
                    $scope.distribution.class[renewalId] = getValueClass(consumedQuantity, avail, completed);
                });

                // Assigned duration to display to the user
                distribution.total = RequestEdit.getDuration(days, hours);
                distribution.totalConsuption = RequestEdit.getDuration(daysConsumed, hoursConsumed);
            }
        }



        /**
         * Create distribution to post for a absence request
         * @param {object} renewals   Rights renenwals distribution with renewal id as property, right id and quantity (the form input) in the value
         * @param {object} periods    The list of selected periods, provided by the period picker widget
         * @param {Boolean} matchQuantity   If true, throw Error if events duration does not match input quantity
         * @return {Array}
         */
        function createDistribution(renewals, periods, accountRights, matchQuantity) {

            var totalSeconds = 0;
            var totalDays = 0;

            for(var j=0; j<periods.length; j++) {
                if (undefined === periods[j].businessDays) {

                    //throw new Error('Missing businessDays on period from '+periods[j].dtstart+' to '+periods[j].dtend);
                    // This is a partial half day, this is not ideal but here we consider the half day is used

                    periods[j].businessDays = 0.5;
                }

                totalDays += periods[j].businessDays;
                totalSeconds += (periods[j].dtend.getTime() - periods[j].dtstart.getTime()) / 1000;
            }



            /**
             *
             *
             * @param {object} selectePeriod    selected working period
             * @param {Date} startDate          Start date for the element
             * @param {Number} secQuantity      Duration for the element
             *
             *
             * @return {object}
             */
            function extractEvent(selectedPeriod, startDate, secQuantity)
            {
                if (selectedPeriod.dtstart > startDate) {
                    // this ignore gaps between selected periods
                    startDate = selectedPeriod.dtstart;
                }

                var validInterval = true;

                if (selectedPeriod.dtend <= startDate) {
                    validInterval = false;
                }

                var endDate = new Date(startDate);
                endDate.setTime(endDate.getTime() + (1000* secQuantity));

                if (selectedPeriod.dtstart >= endDate) {
                    validInterval = false;
                }

                /*
                console.log({
                    selectedPeriod: selectedPeriod,
                    startDate: startDate,
                    endDate: endDate,
                    secQuantity: secQuantity
                });
                */

                var dtstart = selectedPeriod.dtstart > startDate ? selectedPeriod.dtstart : startDate;
                var dtend = selectedPeriod.dtend < endDate ? selectedPeriod.dtend : endDate;

                return {
                    validInterval: validInterval,
                    dtstart: dtstart,
                    dtend: dtend
                };
            }


            /**
             * create events to embed in distribution
             * One event per working period
             *
             * @param {Number} secQuantity              Duration for the element
             * @param {Date} startDate                  Start date for the element
             * @param {Boolean} testIntervalValidity    Verify duration match periods
             *
             * @return {array}
             */
            function createEvents(secQuantity, startDate, testIntervalValidity)
            {

                var event, events = [], consumed;

                periods.forEach(function(selectedPeriod) {
                    event = extractEvent(selectedPeriod, startDate, secQuantity);
                    if (event.validInterval || !testIntervalValidity) {
                        events.push(event);
                        consumed = Math.round((event.dtend.getTime() - event.dtstart.getTime())/1000);
                        //console.log('consumed='+consumed+' secQuantity='+secQuantity);
                        startDate = event.dtend;
                        secQuantity = secQuantity - consumed;

                    }
                });

                if (0 === events.length) {
                    throw new Error(gettextCatalog.getString('Wrong events count'));
                }

                if (matchQuantity && (0 !== secQuantity)) {
                    throw new Error(
                        gettextCatalog.getString('Duration mismatch: {duration} hours remain unconsumed after the creation of {nbEvents} events, please check your absence period, it must not overlap another leave')
                        .replace(/\{duration\}/, secQuantity /3600)
                        .replace(/\{nbEvents\}/,events.length)
                    );
                }

                return events;
            }

            /**
             * Get quantity unit from right ID
             * @return {String} D|H
             */
            function getQuantityUnit(rightId)
            {
                for(var i=0; i<accountRights.length; i++) {
                    if (accountRights[i]._id === rightId) {
                        return accountRights[i].quantity_unit;
                    }
                }

                if (0 === accountRights.length) {
                    throw new Error('No accountRights');
                }

                //console.log(accountRights);
                throw new Error('Right '+rightId+' not found in available accountRights');
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
                    throw new Error(gettextCatalog.getString('Input quantity must be set'));
                }

                var u = getQuantityUnit(rightId);

                if ('H' === u) {
                    return Math.round(inputQuantity*3600);
                }

                if ('D' === u) {

                    if (0 === totalDays || isNaN(totalDays)) {
                        throw new Error('Conversion not appliquable, totalDays must be greater than 0');
                    }

                    return (totalSeconds * inputQuantity / totalDays);
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
                    if (undefined !== rightId._id) {
                        rightId = rightId._id;
                    }

                    elem = {
                        right: {
                            id: rightId,
                            renewal:renewalId
                        },
                        quantity: quantity,
                        events: createEvents(getSecQuantity(rightId, quantity), startDate, matchQuantity)
                    };

                    distribution.push(elem);

                    // set startDate for the next element
                    startDate = elem.events[elem.events.length-1].dtend;
                }
            }

            if (0 === distribution.length) {
                throw new Error(gettextCatalog.getString('Nothing to save'));
            }

            return distribution;
        }

        /**
         * Initialize distribution using data from the request
         */
        function setDistributionRequest($scope) {
            var ai, aj;
            var accessiblesRenewals = [];
            for (ai=0; ai<$scope.accountRights.length; ai++) {
                for (aj=0; aj<$scope.accountRights[ai].renewals.length; aj++) {
                    accessiblesRenewals.push($scope.accountRights[ai].renewals[aj]._id);
                }
            }

            $scope.initialQuantity = {};

            $scope.request.absence.distribution.forEach(function(element) {

                // add renewal only if exists in accountRights

                if (-1 !== accessiblesRenewals.indexOf(element.right.renewal.id)) {

                    $scope.distribution.renewal[element.right.renewal.id] = {
                        quantity: element.quantity,
                        right: element.right.id
                    };

                    $scope.initialQuantity[element.right.renewal.id] = element.quantity;
                }
            });
        }



        /**
         * Initialize distribution for rights where it has been allowed
         */
        function initializeDistribution($scope) {

            //days
            var dispatch = $scope.selection.businessDays;

            var ai, aj;
            for (ai=0; ai<$scope.accountRights.length; ai++) {
                for (aj=0; aj<$scope.accountRights[ai].renewals.length; aj++) {
                    var renewalId = $scope.accountRights[ai].renewals[aj]._id;
                    var right = $scope.accountRights[ai].renewals[aj].right;

                    if (!right.autoDistribution) {
                        continue;
                    }

                    if ('D' !== $scope.accountRights[ai].quantity_unit) {
                        continue;
                    }

                    var quantity = Math.min(dispatch, $scope.accountRights[ai].available_quantity);

                    dispatch -= quantity;

                    $scope.distribution.renewal[renewalId] = {
                        quantity: quantity,
                        right: right._id
                    };

                }
            }
        }

        function cleanDocument(request) {

            if (!request) {
                throw new Error('The request does not exists');
            }

            delete request.requestLog;
            delete request.approvalSteps;

            if (undefined !== request.time_saving_deposit) {
                delete request.time_saving_deposit;
            }

            if (undefined !== request.workperiod_recover) {
                delete request.workperiod_recover;
            }

        }


        /**
         * remove consuption on all rows
         */
        function removeAllConsumptions($scope) {
            var row;

            for (var id in $scope.distribution.renewal) {
                if (!$scope.distribution.renewal.hasOwnProperty(id)) {
                    continue;
                }

                row = $scope.distribution.renewal[id];

                row.consumedQuantity = undefined;
                //row.isLoading = true;
            }
        }


        /**
         * @param {Object} $scope
         * @param {Resource} consumption
         * @param {String} user             User ID when admin create/modify absence for another user
         */
        function setConsumedQuantities($scope, consumption, user) {

            var renewals = $scope.distribution.renewal;
            var periods = $scope.selection.periods;
            var distribution;

            if (0 === periods.length) {
                throw new Error('No periods in selection');
            }

            try {
                distribution = createDistribution(renewals, periods, $scope.accountRights, false);
            } catch(e) {
                removeAllConsumptions($scope);
                return;
            }

            var params = {
                selection: {
                    begin: $scope.selection.begin,
                    end: $scope.selection.end
                },
                distribution: distribution,
                collection: $scope.collection._id
            };


            if (user) {
                params.user = user;
            }

            var row;

            // this is a GET in POST:
            consumption.create(params).$promise
            .then(function(renewalCons) {
                removeAllConsumptions($scope);
                for (var id in renewalCons) {
                    if (!renewalCons.hasOwnProperty(id)) {
                        continue;
                    }

                    row = $scope.distribution.renewal[id];
                    if (undefined === row) {
                        continue;
                    }
                    row.consumedQuantity = renewalCons[id];
                    //row.isLoading = false;
                }

            });

        }




        /**
         * The next button, from the period selection to the right distribution interface
         *
         * @param {object} $scope
         * @param {object} user
         * @param {Resource} accountRights
         * @param {Resource} consumption
         */
        function getNextButtonJob($scope, user, accountRights) {

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

                        setDistributionRequest($scope);
                        distributionWatch($scope.distribution, $scope);
                    }
                    else {
                        // This is a new request, set input quantity for rights where it is allowed
                        initializeDistribution($scope);
                    }


                }, function(err) {
                    err.data.$outcome.alert.forEach(function(e) {
                        $scope.pageAlerts.push({
                            message: e.message,
                            type: 'danger'
                        });
                    });

                });

            };
        }



        /**
         * Process scope once the user document is available
         * Add the watchs
         *
         * @param   {Object} $scope
         * @param   {Object} user           user document as object
         * @param   {Resource} calendarEvents
         * @param   {Resource} consumption
         */
        function onceUserLoaded($scope, user, calendarEvents, consumption)
        {
            if (!user.roles.account) {
                throw new Error('the user must have a vacation account');
            }

            RequestEdit.onceUserLoaded($scope, user, calendarEvents);

            $scope.$watch('distribution', function(distribution) {
                distributionWatch(distribution, $scope);
            }, true);

            $scope.$watch('distribution.renewal', function(newValue, oldValue) {
                // detect renewal modifications
                for (var rId in newValue) {
                    if (newValue.hasOwnProperty(rId)) {
                        if (undefined === oldValue[rId] || (newValue[rId].quantity !== oldValue[rId].quantity)) {
                            return setConsumedQuantities($scope, consumption, user._id);
                        }
                    }
                }
            }, true);
        }


        /**
         * Get Period picker callback for working times
         * @param {Resource} calendarEvents
         * @param {Array} personalEventList personal events list, the list of events curently modified
         * @param {Object} user optional parameter used for admin query
         *
         * @return function
         */
        function getLoadWorkingTimes(calendarEvents, personalEventList, user) {
            return function(interval) {
                var queryParams = {
                    type: 'workschedule',
                    dtstart: interval.from,
                    dtend: interval.to,
                    subtractNonWorkingDays: true,
                    subtractPersonalEvents: true
                };

                if (user) {
                    queryParams.user = user._id;
                }

                if (angular.isArray(personalEventList) && personalEventList.length > 0) {
                    queryParams.subtractException = [];
                    personalEventList.forEach(function(personalEvent) {
                        queryParams.subtractException.push(personalEvent._id);
                    });
                }

                return calendarEvents.query(queryParams).$promise;
            };
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

            createDistribution: createDistribution,
            cleanDocument: cleanDocument,
            getNextButtonJob: getNextButtonJob,
            onceUserLoaded: onceUserLoaded,
            getLoadWorkingTimes: getLoadWorkingTimes
        };
    };
});

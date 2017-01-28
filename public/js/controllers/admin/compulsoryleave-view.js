define([], function() {

    'use strict';

    /**
     * Period duration in milliseconds
     * @params  {object}   previousQuantity
     * @param   {object}   period
     * @returns {object}
     */
    function addPeriodDuration(previousQuantity, period) {

        if (null === previousQuantity) {
            previousQuantity = {
                days: 0,
                hours: 0
            };
        }

        var ms = (period.dtend.getTime() - period.dtstart.getTime());

        return {
            days: previousQuantity.days + period.businessDays,
            hours: ((ms /1000) / 3600)
        };
    }






	return ['$scope', '$location', 'Rest', 'catchOutcome', '$q', 'gettext', '$route',
            function($scope, $location, Rest, catchOutcome, $q, gettext, $route) {


        /**
         * Format quantity available in compulsory leave period
         * @param   {object} quantity days,hours
         * @returns {String|null}
         */
        function formatQuantity(quantity, unit) {

            if (null === quantity) {
                return 0;
            }

            if ('D' === unit) {
                return quantity.days;
            }

            if ('H' === unit) {
                return quantity.hours;
            }
        }





		$scope.compulsoryleave = Rest.admin.compulsoryleaves.getFromUrl().loadRouteId();

        var usersResource = Rest.admin.users.getResource();
        var calendarEventsResource = Rest.admin.calendarevents.getResource();
        var accountRightsResource = Rest.admin.accountrights.getResource();

        var compRequestByUser = {};

        $scope.compRequest = [];

        $scope.compulsoryleave.$promise.then(function() {

            // display list of user, for each users the number of events in the request (available period)
            // display if requests are created or not

            var filter;
            if ($scope.compulsoryleave.collections.length > 0) {
                filter = {
                    collection:  $scope.compulsoryleave.collections.map(function(collection) {
                        return collection._id;
                    }),
                    collection_dtstart: $scope.compulsoryleave.dtstart,
                    collection_dtend: $scope.compulsoryleave.dtend
                };

            } else {
                filter = {
                    department: $scope.compulsoryleave.departments.map(function(department) {
                        return department._id;
                    })
                };
            }

            var users = usersResource.query(filter);
            catchOutcome(users.$promise);

            return users.$promise;
        })
        .then(function(users) {


            var i, userId;

            for (i=0; i<users.length; i++) {
                compRequestByUser[users[i]._id] = {
                    user: {
                        id: users[i]._id,
                        name: users[i].lastname+' '+users[i].firstname,
                        imageUrl: users[i].imageUrl
                    },
                    quantity: null,
                    request: null,
                    disp_unit: null
                };
            }

            // complete informations with the created requests

            for (i=0; i<$scope.compulsoryleave.requests.length; i++) {

                if (!$scope.compulsoryleave.requests[i]) {
                    // the save has probably failed if no content
                    continue;
                }

                userId = $scope.compulsoryleave.requests[i].user.id;


                if (undefined === compRequestByUser[userId]) {
                    compRequestByUser[userId] = {
                        delete: true
                    };
                }

                compRequestByUser[userId].request = $scope.compulsoryleave.requests[i].request;
                compRequestByUser[userId].quantity = $scope.compulsoryleave.requests[i].quantity;
                compRequestByUser[userId].disp_unit = $scope.compulsoryleave.requests[i].disp_unit;
            }


            /**
             * number of valid users in the list
             * @var {Number}
             */
            $scope.validUsers = 0;


            /**
             * Cap simulated quantity from the quantity available in right
             * @param {String} userId
             */
            function capSimulatedQuantity(userId) {

                var cr = compRequestByUser[userId];

                if (!cr.quantity) {
                    return;
                }

                if (undefined === cr.right_quantity) {
                    return;
                }


                cr.capped = (cr.quantity > cr.right_quantity);

                if (!cr.capped) {
                    $scope.validUsers++;
                }
            }


            /**
             * Set simulated quantity for one user
             * @param {String} userId
             * @param {Array} events Promise result
             */
            function setSimulatedQuantity(userId, events) {
                var quantity = null;
                for (var i=0; i<events.length; i++) {
                    quantity = addPeriodDuration(quantity, events[i]);
                }

                compRequestByUser[userId].quantity = formatQuantity(quantity, $scope.compulsoryleave.right.quantity_unit);
                capSimulatedQuantity(userId);
            }


            /**
             * Set available quantity in right for one user
             * @param {String} userId        [[Description]]
             * @param {Array} accountrights  Promise result
             */
            function setRightQuantity(userId, accountrights) {
                for (var i=0; i<accountrights.length; i++) {
                    var accountright = accountrights[i];

                    if ($scope.compulsoryleave.right._id === accountright._id) {
                        compRequestByUser[userId].right_quantity = accountright.available_quantity;
                        capSimulatedQuantity(userId);
                    }
                }
            }


            function setNoRightQuantity(userId) {
                compRequestByUser[userId].right_quantity = 0;
                capSimulatedQuantity(userId);
            }


            var promises = [];

            /**
             * Get a promise with potential failure and add a success promise to the promises array
             * @param   {Promise} p Promise from calendar events or from account right
             * @returns {boolean}  [[Description]]
             */
            function waitEnd(p) {
                // ignore failures
                promises.push(
                    p.catch(function() {
                        return true;
                    })
                );
            }

            // For each missing quantity property, fetch server for a simulation to get the quantity
            // fetch the quantity available on right for each user


            for (userId in compRequestByUser) {
                if (compRequestByUser.hasOwnProperty(userId)) {

                    if (null === compRequestByUser[userId].request) {

                        waitEnd(
                            calendarEventsResource.query({
                                user: userId,
                                type: 'workschedule',
                                subtractNonWorkingDays: true,
                                subtractPersonalEvents: true,
                                dtstart: $scope.compulsoryleave.dtstart,
                                dtend: $scope.compulsoryleave.dtend
                            }).$promise
                            .then(setSimulatedQuantity.bind(null, userId))
                        );

                    }


                    waitEnd(
                        accountRightsResource.query({
                            user: userId,
                            dtstart: $scope.compulsoryleave.dtstart,
                            dtend: $scope.compulsoryleave.dtend
                        }).$promise
                        .then(setRightQuantity.bind(null, userId))
                        .catch(setNoRightQuantity.bind(null, userId))
                    );

                    // store in array for html display
                    $scope.compRequest.push(compRequestByUser[userId]);
                }
            }


            /**
             * Property to unlock the button
             */
            $scope.quantitiesLoaded = false;

            $q.all(promises).then(function() {
                $scope.quantitiesLoaded = true;
            });


            // sort by user name
            $scope.compRequest.sort(function(cr1, cr2) {
                if (cr1.user.name > cr2.user.name) {
                    return 1;
                }
                if (cr1.user.name < cr2.user.name) {
                    return -1;
                }
                return 0;
            });

        });


        function isUserInRequests(id) {
            var requests = $scope.compulsoryleave.requests;
            for (var i=0; i<requests.length; i++) {
                if (requests[i].user.id === id) {
                    return true;
                }
            }

            return false;
        }


        /**
         * Add compulsory leave requests
         */
        $scope.savePeriods = function() {


            $scope.compRequest.forEach(function(cr) {

                if (cr.quantity > 0 && !cr.capped && !isUserInRequests(cr.user.id)) {
                    $scope.compulsoryleave.requests.push({
                        user: {
                            id: cr.user.id
                        }
                    });
                }
            });

            $scope.compulsoryleave.gadaSave().then($route.reload);
        };

        /**
         * Remove compulsory leave requests
         */
        $scope.removePeriods = function() {
            for (var i=0; i<$scope.compRequest.length; i++) {
                $scope.compRequest[i].requests = null;
            }

            $scope.compulsoryleave.requests = [];
            $scope.compulsoryleave.gadaSave().then($route.reload);
        };


        $scope.delete = function() {
            if (confirm(gettext('Are you sure you want to delete this compulsory leave?'))) {
                $scope.compulsoryleave.gadaDelete($location.path('/admin/compulsoryleaves'));
            }
        };

	}];
});

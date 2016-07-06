define([], function() {

    'use strict';

    /**
     * Period duration in milliseconds
     * @param   {object}   period [[Description]]
     * @returns {Number} [[Description]]
     */
    function getPeriodDuration(period) {
        return (period.dtend.getTime() - period.dtstart.getTime());
    }



	return ['$scope', '$location', 'Rest', 'catchOutcome', '$q',
            function($scope, $location, Rest, catchOutcome, $q) {

		$scope.compulsoryleave = Rest.admin.compulsoryleaves.getFromUrl().loadRouteId();

        var usersResource = Rest.admin.users.getResource();
        var calendarEventsResource = Rest.admin.calendarevents.getResource();

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

            users.$promise.then(function() {


                var i, userId;

                for (i=0; i<users.length; i++) {
                    compRequestByUser[users[i]._id] = {
                        user: {
                            id: users[i]._id,
                            name: users[i].lastname+' '+users[i].firstname,
                            image: users[i].image
                        },
                        quantity: null,
                        request: null
                    };
                }

                // complete informations with the created requests

                for (i=0; i<$scope.compulsoryleave.requests.length; i++) {
                    userId = $scope.compulsoryleave.requests[i].user.id;

                    if (undefined === compRequestByUser[userId]) {
                        compRequestByUser[userId] = {
                            delete: true
                        };
                    }

                    compRequestByUser[userId].request = $scope.compulsoryleave.requests[i].request;
                    compRequestByUser[userId].quantity = $scope.compulsoryleave.requests[i].quantity;
                }

                // TODO: for each missing quantity property, fetch server for a simulation to get the quantity

                var workschedulePromises = [];

                for (userId in compRequestByUser) {
                    if (compRequestByUser.hasOwnProperty(userId)) {
                        workschedulePromises.push(
                            calendarEventsResource.query({
                                user: userId,
                                type: 'workschedule',
                                substractNonWorkingDays: true,
                                substractPersonalEvents: true,
                                dtstart: $scope.compulsoryleave.dtstart,
                                dtend: $scope.compulsoryleave.dtend
                            }).$promise
                        );

                        $scope.compRequest.push(compRequestByUser[userId]);
                    }
                }

                $q.all(workschedulePromises).then(function(all) {
                    for (var u=0; u<all.length; u++) {
                        var quantity = 0;
                        for (var i=0; i<all[u].length; i++) {
                            quantity += getPeriodDuration(all[u][i]);
                        }
                        $scope.compRequest[u].quantity = quantity;
                    }
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

        });

	}];
});


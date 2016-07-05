define([], function() {

    'use strict';

	return ['$scope', '$location', 'Rest', 'catchOutcome',
            function($scope, $location, Rest, catchOutcome) {

		$scope.compulsoryleave = Rest.admin.compulsoryleaves.getFromUrl().loadRouteId();

        var usersResource = Rest.admin.users.getResource();

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

            var i, userId;

            for (i=0; i<users.length; i++) {
                compRequestByUser[users[i]._id] = {
                    user: {
                        id: users[i]._id,
                        name: users[i].lastname+' '+users[i].firstname
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

            for (userId in compRequestByUser) {
                if (compRequestByUser.hasOwnProperty(userId)) {
                    $scope.compRequest.push(compRequestByUser[userId]);
                }
            }

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

	}];
});


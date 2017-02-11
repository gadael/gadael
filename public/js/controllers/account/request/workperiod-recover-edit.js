define([], function() {

    'use strict';


	return ['$scope', '$location', 'Rest', '$routeParams', '$rootScope', 'WorkperiodRecoverEdit',
            function($scope, $location, Rest, $routeParams, $rootScope, WorkperiodRecoverEdit) {

        WorkperiodRecoverEdit.initScope($scope);



        // resources
        var unavailableEvents = Rest.account.unavailableevents.getResource();
        var personalEvents = Rest.account.personalevents.getResource();
        var users = Rest.user.user.getResource();
        var calendars = Rest.account.calendars.getResource();
        var calendarEvents = Rest.user.calendarevents.getResource();
        var recoverQuantities = Rest.account.recoverquantities.getResource();


        $scope.request = Rest.account.requests.getFromUrl().loadRouteId();

        $scope.recoverquantities = recoverQuantities.query();

        var userPromise =  users.get().$promise;
        var requestUser = null;

        if ($scope.request.$promise) {
            $scope.request.$promise.then(function() {
                // edit this request
                $scope.editRequest = true;
                WorkperiodRecoverEdit.setSelectionFromRequest($scope);
            });
        } else {

            // create a new request
            $scope.newRequest = true;
            WorkperiodRecoverEdit.initNewRequest($scope);
        }

        $scope.loadNonWorkingTimes = WorkperiodRecoverEdit.getLoadNonWorkingTimes(unavailableEvents);

        userPromise.then(function(user) {

            requestUser = user;
            WorkperiodRecoverEdit.onceUserLoaded($scope, user); // calendarEvents not set to get interval without workschedule
        });

        $scope.loadEvents = WorkperiodRecoverEdit.getLoadEvents(userPromise, personalEvents, calendars, calendarEvents);


        /**
         * Go back to requests list, admin view
         */
        $scope.back = function() {
            $location.path('/account/requests');
        };

        $scope.save = WorkperiodRecoverEdit.getSave($scope);

	}];
});

define([], function() {

    'use strict';


	return ['$scope', '$location', 'Rest', '$routeParams', '$rootScope', 'WorkperiodRecoverEdit',
            function($scope, $location, Rest, $routeParams, $rootScope, WorkperiodRecoverEdit) {

        WorkperiodRecoverEdit.initScope($scope);

        $scope.request = Rest.account.requests.getFromUrl().loadRouteId();
        var unavailableEvents = Rest.account.unavailableevents.getResource();
        var personalEvents = Rest.account.personalevents.getResource();
        var users = Rest.user.user.getResource();
        var calendarEvents = Rest.account.calendarevents.getResource();


        var userPromise =  users.get().$promise;
        var requestUser = null;

        userPromise.then(function(user) {

            requestUser = user;
            WorkperiodRecoverEdit.onceUserLoaded($scope, user, calendarEvents);
        });

        $scope.loadEvents = WorkperiodRecoverEdit.getLoadEvents(personalEvents);
        $scope.loadNonWorkingTimes = WorkperiodRecoverEdit.getLoadNonWorkingTimes(unavailableEvents);


        if ($scope.request.$promise) {
            $scope.request.$promise.then(function() {
                // edit this request
                $scope.editRequest = true;

            });
        } else {

            // create a new request
            $scope.newRequest = true;

            $scope.request.events = [];

        }



        /**
         * Go back to requests list, admin view
         */
        $scope.back = function() {
            $location.path('/account/requests');
        };



        $scope.save = function() {

            // cleanup object
            delete $scope.request.requestLog;
            delete $scope.request.approvalSteps;

            try {
                $scope.request.ingaSave($scope.back);
            } catch(e) {
                $rootScope.pageAlerts.push({
                    message: e.message,
                    type: 'danger'
                });
            }
        };

	}];
});


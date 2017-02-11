define([], function() {

    'use strict';


	return ['$scope', '$location', 'Rest', '$routeParams', '$rootScope', 'WorkperiodRecoverEdit', '$q',
            function($scope, $location, Rest, $routeParams, $rootScope, WorkperiodRecoverEdit, $q) {

        WorkperiodRecoverEdit.initScope($scope);



        // resources
        var unavailableEvents = Rest.admin.unavailableevents.getResource();
        var personalEvents = Rest.admin.personalevents.getResource();
        var users = Rest.admin.users.getResource();
        var calendars = Rest.admin.calendars.getResource();
        var calendarEvents = Rest.admin.calendarevents.getResource();
        var recoverQuantities = Rest.admin.recoverquantities.getResource();

        $scope.request = Rest.admin.requests.getFromUrl().loadRouteId();

        $scope.recoverquantities = recoverQuantities.query();


        var userPromise, userId, requestUser = null;

        if ($scope.request.$promise) {

            var deferred = $q.defer();
            userPromise = deferred.promise;

            $scope.request.$promise.then(function() {
                // edit this request
                $scope.editRequest = true;
                WorkperiodRecoverEdit.setSelectionFromRequest($scope);
                deferred.resolve($scope.request.user);
            });
        } else {

            // create a new request
            userId = $location.search().user;
            userPromise =  users.get({ id: userId }).$promise;
            $scope.newRequest = true;
            WorkperiodRecoverEdit.initNewRequest($scope);

            userPromise.then(function(user) {
                $scope.request.user = {
                    id: user,
                    name: user.lastname+' '+user.firstname
                };
            });
        }

        userPromise.then(function(user) {

            /**
             * Go back to requests list, admin view
             */
            $scope.back = function() {
                $location.path('/admin/users/'+user._id);
            };


            requestUser = user;
            WorkperiodRecoverEdit.onceUserLoaded($scope, user); // calendarEvents not set to get interval without workschedule
            $scope.loadNonWorkingTimes = WorkperiodRecoverEdit.getLoadNonWorkingTimes(unavailableEvents, user);
        });

        $scope.loadEvents = WorkperiodRecoverEdit.getLoadEvents(userPromise, personalEvents, calendars, calendarEvents);



        $scope.save = WorkperiodRecoverEdit.getSave($scope);

	}];
});

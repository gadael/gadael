define([], function() {

    'use strict';

	return [
        '$scope',
        '$routeParams',
        'Calendar',
        '$anchorScroll',
        '$location',
        'Rest',
        'gettext',
        function($scope, $routeParams, Calendar, $anchorScroll, $location, Rest, gettext) {

            $scope.user = Rest.admin.users.getFromUrl().loadRouteId();

            var calendarEventsResource = Rest.admin.calendarevents.getResource();
            var personalEventsResource = Rest.admin.personalevents.getResource();
            var requestsResource = Rest.admin.requests.getResource();

            $scope.user.$promise.then(function() {

                $scope.setPageTitle($scope.user.lastname+' '+$scope.user.firstname+' '+gettext('calendar'));

                Calendar.initLoadMoreData($scope, calendarEventsResource, personalEventsResource, requestsResource);

                $scope.loadPreviousYear = function() {
                    $location.path('/admin/users/'+$scope.user._id+'/calendar/'+$scope.previousYear+'/0');
                };


            });


	    }
    ];
});

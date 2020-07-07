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

            $scope.who = 'admin';
            $scope.user = Rest.admin.users.getFromUrl().loadRouteId();

            var calendarEventsResource = Rest.admin.calendarevents.getResource();
            var personalEventsResource = Rest.admin.personalevents.getResource();
            var requestsResource = Rest.admin.requests.getResource();

            $scope.user.$promise.then(function() {
                $scope.setPageTitle($scope.user.lastname+' '+$scope.user.firstname+' '+gettext('calendar'));

                Calendar.initNextPrevious($scope, calendarEventsResource, personalEventsResource, requestsResource);
            });
	    }
    ];
});

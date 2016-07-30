define([], function() {

    'use strict';

	return ['$scope', '$route', 'Rest', '$http', 'catchOutcome',
        function($scope, $route, Rest, $http, catchOutcome) {

        var googleCalendarsResource = Rest.user.googlecalendars.getResource();

        $scope.user = Rest.user.settings.getFromUrl().gadaGet();

        $scope.connected = false;

        $scope.calendars = googleCalendarsResource.query();

        $scope.calendars.$promise.then(function() {
            $scope.connected = ($scope.calendars.length > 0);
        });


        $scope.googleDisconnect = function() {
            catchOutcome($http.get('/rest/user/googlecalendar/logout')).then($route.reload);
        };

		$scope.saveUser = function() {
			$scope.user.gadaSave($scope.back);
	    };
	}];
});

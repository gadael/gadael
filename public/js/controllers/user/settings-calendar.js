define([], function() {

    'use strict';

	return ['$scope', '$route', 'Rest', '$http', 'catchOutcome',
        function($scope, $route, Rest, $http, catchOutcome) {

        var googleCalendarsResource = Rest.user.googlecalendars.getResource();

        $scope.user = Rest.user.settings.getFromUrl().gadaGet();

        $scope.loaded = false;
        $scope.connected = false;

        $scope.calendars = googleCalendarsResource.query(function() {
            $scope.connected = true;

            if ($scope.calendars.length === 0) {
                // no available secondary calendar
                // TODO: open a modal dialog to create one
            }
        });

        $scope.calendars.$promise.finally(function() {
            $scope.loaded = true;
        });


        $scope.googleDisconnect = function() {
            catchOutcome($http.get('/rest/user/googlecalendar/logout')).then($route.reload);
        };

		$scope.saveUser = function() {
			$scope.user.gadaSave($scope.back);
	    };
	}];
});

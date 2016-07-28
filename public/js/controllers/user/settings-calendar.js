define([], function() {

    'use strict';

	return ['$scope', '$location', 'Rest',
        function($scope, $location, Rest) {

        var googleCalendarsResource = Rest.user.googlecalendars.getResource();

        $scope.user = Rest.user.settings.getFromUrl().gadaGet();

        $scope.connected = false;

        $scope.calendars = googleCalendarsResource.query();

        $scope.calendars.$promise.then(function() {
            $scope.connected = ($scope.calendars.length > 0);
        });


        $scope.googleDisconnect = function() {

        };

		$scope.saveUser = function() {
			$scope.user.gadaSave($scope.back);
	    };
	}];
});

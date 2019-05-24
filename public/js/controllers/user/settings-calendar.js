define([], function() {

    'use strict';

	return ['$scope', '$route', 'Rest', '$http', 'catchOutcome', '$modal', 'gettext',
        function($scope, $route, Rest, $http, catchOutcome, $modal, gettext) {

        var googleCalendarsResource = Rest.user.googlecalendars.getResource();

        $scope.user = Rest.user.settings.getFromUrl().gadaGet();

        $scope.loaded = false;
        $scope.connected = false;

        $scope.calendars = googleCalendarsResource.query(function() {
            $scope.connected = true;

            if ($scope.calendars.length === 0) {
                // no available secondary calendar
                // open a modal dialog to create one
                $scope.add();

            }
        });

        catchOutcome($scope.calendars.$promise);

        $scope.calendars.$promise.finally(function() {
            $scope.loaded = true;
        });

        $scope.add = function() {
            var modalscope = $scope.$new();
            modalscope.calendar = new googleCalendarsResource();
            modalscope.calendar.summary = gettext('Leave periods');

            $modal({
                scope: modalscope,
                templateUrl: 'partials/user/settings-calendar-new.html',
                show: true
            });
        };

        $scope.createCalendar = function(calendar) {
            calendar.$create().then($route.reload);
        };


        $scope.googleDisconnect = function() {
            catchOutcome($http.get('rest/user/googlecalendar/logout')).then($route.reload);
        };

		$scope.saveUser = function() {
			$scope.user.gadaSave($scope.back);
	    };
	}];
});

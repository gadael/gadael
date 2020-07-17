define([], function() {

    'use strict';

	return ['$scope', '$location', 'Rest', function($scope, $location, Rest) {


		$scope.calendar = Rest.admin.calendars.getFromUrl().loadRouteId();

		if (!$scope.calendar.$promise)
		{
			// no promise, new instance
			$scope.calendar.type = 'workschedule';
            $scope.calendar.halfDayHour = new Date(null, null, null, 12, 0);
		}

		$scope.back = function() {
			$location.path('/admin/calendars');
		};

		$scope.saveCalendar = function() {
			$scope.calendar.gadaSave($scope.back);
	    };

	}];
});

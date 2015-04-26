define([], function() {

    'use strict';

	return ['$scope', '$location', 'Rest', function($scope, $location, Rest) {
		
		
		$scope.calendar = Rest.admin.calendars.getFromUrl().loadRouteId();

		if (!$scope.calendar.$promise)
		{
			
			// no promise, new instance
			$scope.calendar.type = 'workschedule';
			$scope.$apply();
		}
		
		$scope.back = function() {
			$location.path('/admin/calendars');
		};
		
		$scope.saveCalendar = function() {
            console.log($scope.calendar);
            return;
			$scope.calendar.ingaSave($scope.back);
	    };
	    
	}];
});


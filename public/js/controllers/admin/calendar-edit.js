define([], function() {

    'use strict';

	return ['$scope', '$location', 'IngaResource', function($scope, $location, IngaResource) {
		
		
		$scope.calendar = IngaResource('rest/admin/calendars').loadRouteId();

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
			$scope.calendar.ingaSave($scope.back);
	    };
	    
	}];
});


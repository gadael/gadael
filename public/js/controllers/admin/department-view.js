define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        'departmentDays', function(
			$scope,
			$location,
			Rest,
            departmentDays
		) {

		$scope.department = Rest.admin.departments.getFromUrl().loadRouteId();

        var collaboratorsResource = Rest.admin.collaborators.getResource();
        var calendareventsResource = Rest.admin.calendarevents.getResource();

        departmentDays($scope, collaboratorsResource, calendareventsResource, 14);


		$scope.cancel = function() {
			$location.path('/admin/departments');
		};


	}];
});


define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        'departmentDays',
        '$routeParams', function(
			$scope,
			$location,
			Rest,
            departmentDays,
            $routeParams
		) {

		$scope.department = Rest.admin.departments.getFromUrl().loadRouteId();


        $scope.approval = [];

        $scope.department.$promise.then(function(department) {

            if (department.managers.length > 0) {
                $scope.approval.push(department);
            }

            var ancestor;

            for (var i=0; i<$scope.department.ancestors.length; i++) {
                ancestor = $scope.department.ancestors[i];
                if (ancestor.managers.length > 0) {
                    $scope.approval.push(ancestor);
                }
            }


        });



        var collaboratorsResource = Rest.admin.collaborators.getResource();
        var calendareventsResource = Rest.admin.calendarevents.getResource();

        departmentDays($scope, collaboratorsResource, calendareventsResource, 14, $routeParams.id, true);


		$scope.cancel = function() {
			$location.path('/admin/departments');
		};


	}];
});


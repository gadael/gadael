define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        'departmentDays',
         function(
			$scope,
			$location,
			Rest,
            departmentDays
		) {

		$scope.department = Rest.admin.departments.getFromUrl().loadRouteId();


        /**
         * List of approval levels (deparmtent and managers)
         */
        $scope.approval = [];

        /**
         * Flattended array of departments
         */
        $scope.allDepartments = [];

        /**
         * Recursive loader
         */
        function getSubDepartments(department) {
            department.days = departmentDays(collaboratorsResource, calendareventsResource, 14, department._id, true);
            $scope.allDepartments.push(department);
            department.children.forEach(getSubDepartments);
        }

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

            getSubDepartments($scope.department);
        });



        var collaboratorsResource = Rest.admin.collaborators.getResource();
        var calendareventsResource = Rest.admin.calendarevents.getResource();



		$scope.cancel = function() {
			$location.path('/admin/departments');
		};


	}];
});


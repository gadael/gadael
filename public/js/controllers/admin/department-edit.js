define([], function() {
    
    'use strict';

	return ['$scope', '$location', 'Rest', '$routeParams', function($scope, $location, Rest, $routeParams) {

		$scope.department = Rest.admin.departments.getFromUrl().loadRouteId();


        if (undefined === $scope.department.$promise) {
            // new item
            $scope.department.operator = 'OR';
        }

        var departmentsResource = Rest.admin.departments.getResource();
        $scope.departments = departmentsResource.query();

		$scope.back = function() {
            if (undefined !== $routeParams.id) {
			    $location.path('/admin/departments/'+$routeParams.id);
            } else {
                $location.path('/admin/departments');
            }
		};
		
		$scope.saveDepartment = function() {
            delete $scope.department.managers;
            delete $scope.department.subDepartments;
			$scope.department.gadaSave($scope.back);
	    };
	}];
});


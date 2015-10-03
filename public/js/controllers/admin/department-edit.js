define([], function() {
    
    'use strict';

	return ['$scope', '$location', 'Rest', function($scope, $location, Rest) {

		$scope.department = Rest.admin.departments.getFromUrl().loadRouteId();


        if (undefined === $scope.department.$promise) {
            // new item
            $scope.department.operator = 'OR';
        }



		$scope.back = function() {
			$location.path('/admin/departments');
		};
		
		$scope.saveDepartment = function() {
			$scope.department.ingaSave($scope.back);
	    };
	}];
});


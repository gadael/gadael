define([], function() {
    
    'use strict';

	return ['$scope', '$location', 'Rest', '$routeParams', function($scope, $location, Rest, $routeParams) {

		$scope.department = Rest.admin.departments.getFromUrl().loadRouteId();


        if (undefined === $scope.department.$promise) {
            // new item
            $scope.department.operator = 'OR';
        }



		$scope.back = function() {
			$location.path('/admin/departments/'+$routeParams.id);
		};
		
		$scope.saveDepartment = function() {
            delete $scope.department.managers;
			$scope.department.ingaSave($scope.back);
	    };
	}];
});


define([], function() {

	return ['$scope', '$location', 'IngaResource', function($scope, $location, IngaResource) {

		$scope.department = IngaResource('rest/admin/departments').loadRouteId();

		$scope.back = function() {
			$location.path('/admin/departments');
		}
		
		$scope.saveDepartment = function() {
			$scope.department.ingaSave($scope.back);
	    }
	}];
});


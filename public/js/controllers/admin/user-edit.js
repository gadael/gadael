define([], function() {
	return ['$scope', '$location', 'IngaResource', 'loadCollectionsOptions', 'loadDepartmentsOptions', function($scope, $location, IngaResource, loadCollectionsOptions, loadDepartmentsOptions) {

		$scope.user = IngaResource('rest/admin/users').loadRouteId();
		
		loadCollectionsOptions($scope);
		loadDepartmentsOptions($scope);
		
		
		$scope.cancel = function() {
			$location.path('/admin/users');
		}
		
		
		$scope.saveUser = function() {
			$scope.user.ingaSave();
			$scope.cancel();
	    }
	}];
});


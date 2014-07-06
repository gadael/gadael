define(['jquery'], function() {
	return ['$scope', '$location', 'IngaResource', function($scope, $location, IngaResource) {

		$scope.user = IngaResource('rest/admin/users').loadRouteId();
		
		
		$scope.cancel = function() {
			$location.path('/admin/users');
		}
		
		
		$scope.saveUser = function() {
			$scope.user.ingaSave();
			$scope.cancel();
	    }
	}];
});


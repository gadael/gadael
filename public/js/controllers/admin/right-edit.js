define([], function() {

	return ['$scope', '$location', 'IngaResource', function($scope, $location, IngaResource) {

		$scope.right = IngaResource('rest/admin/rights').loadRouteId();

		$scope.back = function() {
			$location.path('/admin/rights');
		}
		
		$scope.saveRight = function() {
			$scope.right.ingaSave($scope.back);
	    }
	}];
});


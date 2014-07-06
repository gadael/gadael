define([], function() {

	return ['$scope', '$location', 'IngaResource', function($scope, $location, IngaResource) {

		$scope.collection = IngaResource('rest/admin/collections').loadRouteId();

		$scope.back = function() {
			$location.path('/admin/collections');
		}
		
		$scope.saveCollection = function() {
			$scope.collection.ingaSave();
			$scope.back();
	    }
	}];
});


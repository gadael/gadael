define([], function() {

	return ['$scope', '$location', 'IngaResource', function($scope, $location, IngaResource) {

		$scope.collection = IngaResource('rest/admin/collections').load();

		$scope.back = function() {
			$location.path('/admin/collections');
		}
		
		$scope.saveCollection = function() {
			$scope.collection.$save();
			$scope.back();
	    }
	}];
});


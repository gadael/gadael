define([], function() {

	return ['$scope', '$location', 'IngaResource', function($scope, $location, IngaResource) {

		$scope.collection = IngaResource('rest/admin/calendars').loadRouteId();

		$scope.back = function() {
			$location.path('/admin/calendars');
		}
		
		$scope.saveCollection = function() {
			$scope.collection.ingaSave($scope.back);
	    }
	}];
});


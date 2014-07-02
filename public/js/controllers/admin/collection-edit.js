define(['jquery'], function() {
	return ['$scope', '$location', 'loadItem', 'saveItem', function($scope, $location, loadItem, saveItem) {

		loadItem('rest/admin/collections/:id', function(data) {
			$scope.collection = data;
		});
		
		
		$scope.cancel = function() {
			$location.path('/admin/collections');
		}
		
		
		$scope.saveCollection = function() {
			saveItem('rest/admin/collections/save', $scope.collection);
			$scope.cancel();
	    }
	}];
});


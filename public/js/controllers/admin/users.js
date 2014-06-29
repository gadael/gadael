define([], function() {
	return ['$scope', '$http', function($scope, $http) {

		$http.get('/rest/admin/collections')
               .then(function(result) {
					$scope.collections = result.data;
					$scope.collections.unshift({ name: '', _id:'' });
		});
		
	}];
});

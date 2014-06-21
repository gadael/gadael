define([], function() {
	return ['$scope', '$http', function($scope, $http) {

		$http.get('/rest/admin/collections')
               .then(function(result) {
					$scope.collections = result.data;
		});
		
		$scope.usersUrl = '/rest/admin/users?name='; // +$scope.search.name
		
	}];
});

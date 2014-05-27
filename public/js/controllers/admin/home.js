
define([], function() {
	return ['$scope', '$http', function($scope, $http) {
		

		

		return $http.get('/rest/admin')
                       .then(function(result) {

				$scope.menu = result.data.menu;

				$scope.$apply();

                           // return result.data;
                        });
	}];
});

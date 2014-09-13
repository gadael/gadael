define([], function() {
    
    'use strict';
    
	return ['$scope', '$http', function($scope, $http) {

		$http.get('/rest/admin')
               .then(function(result) {
					$scope.menu = result.data.menu;
		});
	}];
});

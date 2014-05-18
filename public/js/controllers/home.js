define([], function() {
	return ['$scope', '$http', function($scope, $http) {
		
		
		$scope.home = {
				title: 'hey this is home.js!'
		};

		$scope.$apply();
	}];
});
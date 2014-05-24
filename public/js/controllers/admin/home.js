
define([], function() {
	return ['$scope', '$http', function($scope, $http) {
		
		$scope.welcomeMessage = 'hey this is myctrl2.js!';

		$scope.$apply();
	}];
});

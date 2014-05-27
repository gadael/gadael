define([], function() {
	return ['$scope', '$http', 'authService', function($scope, $http, authService) {
		
		$scope.submit = function() {
	      $http.post('auth/login').success(function() {
	        authService.loginConfirmed();
	      });
	    }
	}];
});
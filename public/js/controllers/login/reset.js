define([], function() {

    'use strict';

	return ['$scope', '$http', '$location', '$routeParams', 'catchOutcome', function($scope, $http, $location, $routeParams, catchOutcome) {


		$scope.submit = function() {

			catchOutcome(
                $http.post('rest/login/reset', {
    				password: $scope.password,
    				confirm: $scope.confirm,
    				email: $routeParams.email,
    				token: $routeParams.token
    			})
            )
			.then(function() {
                $location.path('/login');
			});
	    };
	}];
});

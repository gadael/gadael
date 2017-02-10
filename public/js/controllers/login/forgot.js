define([], function() {

    'use strict';

	return ['$scope', '$http', '$location', 'catchOutcome', function($scope, $http, $location, catchOutcome) {


        $scope.back = function() {
            $location.path('/');
        };


		$scope.submit = function() {

			catchOutcome($http.post('rest/login/forgot', {
				email: $scope.email
			}))
            .then($scope.back);
	    };
	}];
});

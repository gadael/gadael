define([], function() {
    
    'use strict';
    
	return ['$scope', '$location', 'IngaResource', function($scope, $location, IngaResource) {
		
		$scope.user = IngaResource('rest/user/settings').loadRouteId();

		$scope.back = function() {
			// TODO: go to a user homepage
		};
		
		$scope.saveUser = function() {
			$scope.user.ingaSave($scope.back);
	    };
	}];
});

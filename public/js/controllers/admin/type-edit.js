define([], function() {
    'use strict';

	return ['$scope', '$location', 'IngaResource', function($scope, $location, IngaResource) {

		$scope.type = IngaResource('rest/admin/types').loadRouteId();

		$scope.back = function() {
			$location.path('/admin/types');
		};
		
		$scope.saveType = function() {
			$scope.type.ingaSave($scope.back);
	    };
	}];
});


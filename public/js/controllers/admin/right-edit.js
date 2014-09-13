define([], function() {
    
    'use strict';

	return ['$scope', '$location', 'IngaResource', 'loadTypesOptions', function($scope, $location, IngaResource, loadTypesOptions) {

		$scope.right = IngaResource('rest/admin/rights').loadRouteId();
        
        loadTypesOptions($scope);

		$scope.back = function() {
			$location.path('/admin/rights');
		};
		
		$scope.saveRight = function() {
			$scope.right.ingaSave($scope.back);
	    };
	}];
});


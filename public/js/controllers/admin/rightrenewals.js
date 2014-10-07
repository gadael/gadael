define([], function() {
    
    'use strict';

	return ['$scope', '$location', 'IngaResource', function($scope, $location, IngaResource, loadTypesOptions) {

		$scope.right = IngaResource('rest/admin/rights').loadRouteId();
        
		$scope.back = function() {
			$location.path('/admin/rights');
		};
		
		$scope.addRightRenewal = function() {
			
	    };
	}];
});


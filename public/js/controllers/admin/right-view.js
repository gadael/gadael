define([], function() {
    'use strict';
    
	return ['$scope', 
		'$location', 
		'IngaResource', 
		'$resource',
        '$http', function(
			$scope, 
			$location, 
			IngaResource, 
			$resource,
            $http
		) {

		$scope.right = IngaResource('rest/admin/rights').loadRouteId();
        
		
		
		$scope.cancel = function() {
			$location.path('/admin/rights');
		};

	}];
});


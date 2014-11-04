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
                
                
        var rightRule = $resource('rest/admin/rightrules/');
        var rightRenewal = $resource('rest/admin/rightrenewals/');

		$scope.right = IngaResource('rest/admin/rights').loadRouteId();
                
        
        $scope.right.$promise.then(function() {
            $scope.rightRules = rightRule.query({ right: $scope.right._id });
            $scope.rightRenewals = rightRenewal.query({ right: $scope.right._id });
        });
        
        
        
		
		$scope.cancel = function() {
			$location.path('/admin/rights');
		};

	}];
});


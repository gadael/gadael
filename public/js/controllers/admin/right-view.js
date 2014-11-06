define([], function() {
    'use strict';
    
	return ['$scope', 
		'$location', 
		'IngaResource', 
		'ResourceFactory',
        '$http', function(
			$scope, 
			$location, 
			IngaResource, 
			ResourceFactory,
            $http
		) {
                
                
        var rightRule = ResourceFactory('rest/admin/rightrules/:id');
        var rightRenewal = ResourceFactory('rest/admin/rightrenewals/:id');

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


define([], function() {
    'use strict';
    
	return ['$scope', 
		'$location', 
		'Rest',
        function(
			$scope, 
			$location, 
			Rest
		) {
                

        var rightRenewal = Rest.admin.rightrenewals.getResource();
		$scope.right = Rest.admin.rights.getFromUrl().loadRouteId();
        
        $scope.right.$promise.then(function() {
            $scope.rightRenewals = rightRenewal.query({ right: $scope.right._id });
        });
        
        
        
		
		$scope.cancel = function() {
			$location.path('/admin/rights');
		};

	}];
});


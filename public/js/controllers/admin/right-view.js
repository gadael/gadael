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
                

        var rightRenewalsResource = Rest.admin.rightrenewals.getResource();
        var collectionsResource = Rest.admin.collections.getResource();

		$scope.right = Rest.admin.rights.getFromUrl().loadRouteId();
        
        $scope.right.$promise.then(function() {
            $scope.rightRenewals = rightRenewalsResource.query({ right: $scope.right._id });
            $scope.collections = collectionsResource.query({ right: $scope.right._id });
        });
        
        
        
		
		$scope.cancel = function() {
			$location.path('/admin/rights');
		};

	}];
});


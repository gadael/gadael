define([], function() {
    'use strict';
    
	return ['$scope', 
		'$location', 
		'Rest' , function(
			$scope, 
			$location, 
			Rest 
		) {
                

		$scope.request = Rest.admin.requests.getFromUrl().loadRouteId();
        
        $scope.request.$promise.then(function() {
            
        });
        

		$scope.cancel = function() {
			$location.path('/admin/requests');
		};

	}];
});


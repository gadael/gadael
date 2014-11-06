define([], function() {
    
    'use strict';

	return ['$scope', '$location', 'ResourceFactory', function($scope, $location, ResourceFactory) {

        
        
        var rightResource = ResourceFactory('rest/admin/rights/:id');

        $scope.search = {
          right: $location.search().right
        };
        
		$scope.right = rightResource.get({id: $location.search().right});

		$scope.back = function() {
			$location.path('/admin/rights');
		};
		
		$scope.addRightRenewal = function() {
			
	    };
	}];
});


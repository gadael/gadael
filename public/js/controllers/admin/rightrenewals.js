define([], function() {
    
    'use strict';

	return ['$scope', '$location', '$resource', function($scope, $location, $resource) {

        
        
        var rightResource = $resource('rest/admin/rights/:id', {id:'@id'});

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


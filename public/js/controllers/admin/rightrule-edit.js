define([], function() {
    
    'use strict';

	return [
        '$scope',
        '$location',
        'Rest', function($scope, $location, Rest) {

            
        var rightResource = Rest.admin.rights.getResource();
            
        if ($location.search().right) {
            $scope.right = rightResource.get({id: $location.search().right});
        }
            
        $scope.rightrule = Rest.admin.rightrules.getFromUrl().loadRouteId();
        if ($scope.rightrule.$promise) {
            $scope.rightrule.$promise.then(
                function(rightrule) {
                    $scope.right = rightResource.get({id: rightrule.right});
                }
            );
        } else {
            // init with default values
            
            
        }
            
        
            

		$scope.back = function() {
			$location.url('/admin/rights/'+$scope.right._id);
		};
		
		$scope.saveRightrule = function() {
            
            if (!$scope.rightrule.right) {
                $scope.rightrule.right = $scope.right._id;
            }
            
			$scope.rightrule.ingaSave($scope.back);
	    };
	}];
});


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
            
        $scope.rightrenewal = Rest.admin.rightrenewals.getFromUrl().loadRouteId();
        if ($scope.rightrenewal.$promise) {
            $scope.rightrenewal.$promise.then(
                function(rightrenewal) {
                    $scope.right = rightResource.get({id: rightrenewal.right});
                }
            );
        } else {
            // init with default values
            
            $scope.right.$promise.then(function() {
                var lastRenewal = $scope.right.lastRenewal;
                if (lastRenewal) {
                    var lastFinish = new Date(lastRenewal.finish);
                    $scope.rightrenewal.start = lastFinish;
                    $scope.rightrenewal.start.setDate(lastFinish.getDate() + 1);
                }
            });
            
        }   

		$scope.back = function() {
			$location.url('/admin/rights/'+$scope.right._id);
		};
		
		$scope.saveRightrenewal = function() {
            
            if (!$scope.rightrenewal.right) {
                $scope.rightrenewal.right = $scope.right._id;
            }
            
			$scope.rightrenewal.gadaSave($scope.back);
	    };
	}];
});


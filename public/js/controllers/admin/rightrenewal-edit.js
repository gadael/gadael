define([], function() {
    
    'use strict';

	return [
        '$scope',
        '$location',
        'IngaResource',
        '$resource', function($scope, $location, IngaResource, $resource) {

        
        $scope.rightrenewal = IngaResource('rest/admin/rightrenewals').loadRouteId();    
            
        var rightResource = $resource('rest/admin/rights/:id', {id:'@id'});
		$scope.right = rightResource.get({id: $location.search().right});

		$scope.back = function() {
			$location.url('/admin/rightrenewals?right='+$scope.right._id);
		};
		
		$scope.saveRightrenewal = function() {
            
            if (!$scope.rightrenewal.right) {
                $scope.rightrenewal.right = $scope.right._id;
            }
            
			$scope.rightrenewal.ingaSave($scope.back);
	    };
	}];
});


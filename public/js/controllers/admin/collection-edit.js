define([], function() {
    
    'use strict';

	return ['$scope', '$location', 'IngaResource', '$resource', 'catchOutcome', 
    function($scope, $location, IngaResource, $resource, catchOutcome) {

		$scope.collection = IngaResource('rest/admin/collections').loadRouteId();
        
        var rights = $resource('rest/admin/rights');
	    var beneficiaries = $resource('rest/admin/beneficiaries/');
        
        $scope.rights = rights.query();
        
        if ($scope.collection.$promise) {
            $scope.collection.$promise.then(function(collection) {
                $scope.collectionRights = beneficiaries.query(
                    { document: collection._id , ref: 'Collection' }, function() {
                    if (0 === $scope.collectionRights.length) {
                        $scope.addRight();
                    }
                });
            });
        }
        
        
        $scope.addRight = function() {
            $scope.collectionRights.push({ right: null });
        };
        
        /**
         * Delete
         */
		$scope.removeRight = function(index) {
            var right = $scope.collectionRights[index];

            if (undefined === right._id || null === right._id) {
                $scope.collectionRights.splice(index, 1);
                return;
            }
            
            var p = right.$delete().then(function() {
                $scope.collectionRights.splice(index, 1);
            });
            
            catchOutcome(p);
		};

		$scope.back = function() {
			$location.path('/admin/collections');
		};
		
		$scope.saveCollection = function() {
			$scope.collection.ingaSave($scope.back);
	    };
	}];
});


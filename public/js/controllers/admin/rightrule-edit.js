define([], function() {
    
    'use strict';

	return [
        '$scope',
        '$location',
        'Rest', function($scope, $location, Rest) {

            
        var rightResource = Rest.admin.rights.getResource();
        var rightRenewal = Rest.admin.rightrenewals.getResource();
            
        function onRightLoaded(right) {

            // load last renewal for right
            rightRenewal.query({right: right._id}).$promise.then(function(renewals) {
                $scope.renewal = renewals[0];
            });

            //TODO: populate $scope.rightrule
        }
            

            
        if ($location.search().right) {
            $scope.right = rightResource.get({id: $location.search().right});
            $scope.right.$promise.then(onRightLoaded);
        }
            

        $scope.step = 1;
        $scope.rightrule = {
            type: 'entry_date'
        };

        $scope.next = function() {
            $scope.step = 2;
        };

		$scope.back = function() {
			$location.url('/admin/rights/'+$scope.right._id);
		};
		
		$scope.saveRightrule = function() {
            
            //TODO add or replace $scope.rightrule into right document
			$scope.right.$save($scope.back);
	    };
	}];
});


define([], function() {
    
    'use strict';

	return ['$scope', '$location', 'Rest', function($scope, $location, Rest) {

		$scope.right = Rest.admin.rights.getFromUrl().loadRouteId();
        $scope.types = Rest.admin.types.getResource().query();

        $scope.quantityUnits = [{
            value: 'D',
            label: 'Days'
        },
        {
            value: 'H',
            label: 'Hours'
        }];

		$scope.back = function() {
			$location.path('/admin/rights');
		};
		
		$scope.saveRight = function() {
			$scope.right.gadaSave($scope.back);
	    };
	}];
});


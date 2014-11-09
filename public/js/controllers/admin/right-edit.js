define([], function() {
    
    'use strict';

	return ['$scope', '$location', 'Rest', function($scope, $location, Rest) {

		$scope.right = Rest.admin.rights.getFromUrl().loadRouteId();
        $scope.types = Rest.admin.types.getResource().query();

		$scope.back = function() {
			$location.path('/admin/rights');
		};
		
		$scope.saveRight = function() {
			$scope.right.ingaSave($scope.back);
	    };
	}];
});


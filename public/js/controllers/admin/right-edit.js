define([], function() {
    
    'use strict';

	return ['$scope', '$location', 'Rest', 'loadTypesOptions', function($scope, $location, Rest, loadTypesOptions) {

		$scope.right = Rest.admin.rights.getFromUrl().loadRouteId();
        
        loadTypesOptions($scope);

		$scope.back = function() {
			$location.path('/admin/rights');
		};
		
		$scope.saveRight = function() {
			$scope.right.ingaSave($scope.back);
	    };
	}];
});


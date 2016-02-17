define([], function() {
    'use strict';

	return ['$scope', '$location', 'Rest', function($scope, $location, Rest) {

		$scope.type = Rest.admin.types.getFromUrl().loadRouteId();

		$scope.back = function() {
			$location.path('/admin/types');
		};
		
		$scope.saveType = function() {
			$scope.type.gadaSave($scope.back);
	    };
	}];
});


define([], function() {

    'use strict';

	return ['$scope', '$location', 'Rest', function($scope, $location, Rest) {

		$scope.compulsoryleave = Rest.admin.compulsoryleaves.getFromUrl().loadRouteId();



	}];
});


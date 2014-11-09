define([], function() {
    'use strict';
    return [
		'$scope', 
		'Rest',
		function($scope, Rest) {

			$scope.types = Rest.admin.types.getResource().query();

		}
	];
});

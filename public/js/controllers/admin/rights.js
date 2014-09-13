define([], function() {
    'use strict';
    return [
		'$scope', 
		'loadTypesOptions',
		function($scope, loadTypesOptions) {

			loadTypesOptions($scope);
			

		}
	];
});

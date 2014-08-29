define([
    'angularstraptpl',
	'angular_frfr',
	'angularAnimate',
	'angularSanitize'], function() {
	return [
		'$scope', 
		'loadCollectionsOptions', 
		'loadDepartmentsOptions', 
		function($scope, loadCollectionsOptions, loadDepartmentsOptions) {

			loadCollectionsOptions($scope);
			loadDepartmentsOptions($scope);

		}
	];
});

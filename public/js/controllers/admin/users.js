define([
    'angularstraptpl',
	'angular_frfr',
	'angularAnimate',
	'angularSanitize'], function() {
        
    'use strict';
        
	return [
		'$scope', 
		'loadCollectionsOptions', 
		'loadDepartmentsOptions', 
		function($scope, loadCollectionsOptions, loadDepartmentsOptions) {
            
            $scope.search = {};

			loadCollectionsOptions($scope);
			loadDepartmentsOptions($scope);

		}
	];
});

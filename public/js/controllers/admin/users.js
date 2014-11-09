define([
    'angularstraptpl',
	'angular_frfr',
	'angularAnimate',
	'angularSanitize'], function() {
        
    'use strict';
        
	return [
		'$scope', 
        'Rest',
		function($scope, Rest) {
            
            $scope.search = {};

            $scope.collections = Rest.admin.collections.getResource().query();
            $scope.departments = Rest.admin.departments.getResource().query();
		}
	];
});

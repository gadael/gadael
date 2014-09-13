define(['angularstraptpl',
	'angular_frfr',
	'angularAnimate',
	'angularSanitize'], function() {
        
    'use strict';
    
	return ['$scope', function($scope) {
		
		
		$scope.home = {
				title: 'hey this is home.js!'
		};
        
		$scope.$apply();
	}];
});

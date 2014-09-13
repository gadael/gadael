define([], function() {
    'use strict';
	return ['$scope', function($scope) {
		
		$scope.welcomeMessage = 'hey this is myctrl2.js!';

		$scope.$apply();
	}];
});

define([], function() {
    
    'use strict';
    
	return ['$scope', '$location', 'Rest', function($scope, $location, Rest) {
		
        $scope.user = Rest.user.settings.getFromUrl().ingaGet();



		$scope.back = function() {
			// TODO: go to a user homepage
		};
		
		$scope.saveUser = function() {
			$scope.user.ingaSave($scope.back);
	    };
	}];
});

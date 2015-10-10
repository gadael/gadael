define([], function() {
    
    'use strict';
    
	return ['$scope', '$location', 'Rest', 'UserEdit',
        function($scope, $location, Rest, UserEdit) {
		
        $scope.user = Rest.user.settings.getFromUrl().ingaGet();

        /**
         * setImage modal popup
         */
        $scope.setImage = UserEdit.setImage($scope);

		$scope.back = function() {
			// TODO: go to a user homepage
		};
		
		$scope.saveUser = function() {
			$scope.user.ingaSave($scope.back);
	    };
	}];
});

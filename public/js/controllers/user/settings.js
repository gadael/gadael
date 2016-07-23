define([], function() {
    
    'use strict';
    
	return ['$scope', '$location', 'Rest', 'UserEdit',
        function($scope, $location, Rest, UserEdit) {
		
        $scope.user = Rest.user.settings.getFromUrl().gadaGet();

        /**
         * setImage modal popup
         */
        $scope.setImage = UserEdit.setImage($scope);
		
		$scope.saveUser = function() {
			$scope.user.gadaSave($scope.back);
	    };
	}];
});

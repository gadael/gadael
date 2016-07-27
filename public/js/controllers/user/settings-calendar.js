define([], function() {

    'use strict';

	return ['$scope', '$location', 'Rest',
        function($scope, $location, Rest) {

        $scope.user = Rest.user.settings.getFromUrl().gadaGet();

        $scope.connected = false;


        $scope.googleDisconnect = function() {

        };

		$scope.saveUser = function() {
			$scope.user.gadaSave($scope.back);
	    };
	}];
});

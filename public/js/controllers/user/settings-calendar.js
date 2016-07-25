define([], function() {

    'use strict';

	return ['$scope', '$location', 'Rest', '$http',
        function($scope, $location, Rest, $http) {

        $scope.user = Rest.user.settings.getFromUrl().gadaGet();

        $scope.connected = false;

        $scope.googleConnect = function() {
            $http.get('/rest/user/googlecalendar');
        };

        $scope.googleDisconnect = function() {

        };

		$scope.saveUser = function() {
			$scope.user.gadaSave($scope.back);
	    };
	}];
});

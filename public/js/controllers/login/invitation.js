define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        function(
			$scope,
			$location,
			Rest
		) {

		$scope.user = Rest.anonymous.invitation.getFromUrl().loadRouteId();


        /**
         * Go to login page
         */
        $scope.login = function() {
            $location.path('/login');
        };


		/**
         * Save button
         */
		$scope.saveUser = function() {
            $scope.user.gadaSave($scope.login);
	    };


	}];
});

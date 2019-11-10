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

		$scope.user = Rest.anonymous.createfirstadmin.getFromUrl().loadRouteId();


        /**
         * Go to home page and refresh
         */
        $scope.home = function() {
            document.location.href = './';
        };


		/**
         * Save button
         */
		$scope.saveUser = function() {
            $scope.user.gadaSave($scope.home);
	    };


	}];
});

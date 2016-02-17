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
         * Save button
         */
		$scope.saveUser = function() {
            $scope.user.gadaSave();
	    };


	}];
});


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

		$scope.user = Rest.admin.users.getResource();


		/**
         * Save button
         */
		$scope.saveUser = function() {
			$scope.user.ingaSave();
	    };


	}];
});


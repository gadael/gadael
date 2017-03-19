define([], function() {
    'use strict';

	return ['$scope',
		'$location',
        '$routeParams',
		'Rest',
        'catchOutcome',
        function(
			$scope,
			$location,
            $routeParams,
			Rest,
            catchOutcome
		) {

        $scope.user = Rest.anonymous.invitation.getFromUrl().loadRouteId();
        var Invitation = Rest.anonymous.invitation.getResource();

		$scope.invitation = Invitation.get({ emailToken: $routeParams.emailToken });

        catchOutcome($scope.invitation.$promise);




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
            $scope.user.emailToken = $routeParams.emailToken;
            $scope.user.gadaSave($scope.login);
	    };


	}];
});

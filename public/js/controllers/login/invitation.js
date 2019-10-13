define([], function() {
    'use strict';

	return ['$scope',
		'$location',
        '$route',
        '$routeParams',
		'Rest',
        'catchOutcome',
        function(
			$scope,
			$location,
            $route,
            $routeParams,
			Rest,
            catchOutcome
		) {

        $scope.user = Rest.anonymous.invitation.getFromUrl().loadRouteId();
        var Invitation = Rest.anonymous.invitation.getResource();

		$scope.invitation = Invitation.get({ emailToken: $routeParams.emailToken });

        catchOutcome($scope.invitation.$promise);




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
            $scope.user.emailToken = $routeParams.emailToken;
            $scope.user.gadaSave($scope.home);
	    };


	}];
});

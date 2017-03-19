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

		var invitation = Invitation.get({ emailToken: $routeParams.emailToken });
        catchOutcome(invitation.$promise)
        .then(function() {
            console.log(invitation);
        });




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

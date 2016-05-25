define([], function() {
    'use strict';

	return [
        '$scope',
        '$location',
		'Rest',
        function(
			$scope,
            $location,
			Rest
		) {

		$scope.user = Rest.admin.users.getFromUrl().loadRouteId();

        if ($scope.user.$promise) {
            $scope.user.$promise.then(function() {


            });
        }


		$scope.cancel = function() {
			$location.path('/admin/users/'+$scope.user._id);
		};


		/**
         * Save button
         */
		$scope.save = function() {
            $scope.user.ingaSave().then($scope.cancel);
	    };

	}];
});


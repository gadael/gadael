define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        '$modal',
        'UserEdit',
        'getOnlyIds',
        function(
			$scope,
			$location,
			Rest,
            $modal,
            UserEdit,
            getOnlyIds
		) {

		$scope.user = Rest.admin.users.getFromUrl().loadRouteId();

        if ($scope.user.$promise) {
            $scope.user.$promise.then(function() {

                $scope.user.isAccount 	= ($scope.user.roles && $scope.user.roles.account 	!== undefined && $scope.user.roles.account 	!== null);
                $scope.user.isAdmin 	= ($scope.user.roles && $scope.user.roles.admin 	!== undefined && $scope.user.roles.admin 	!== null);
                $scope.user.isManager 	= ($scope.user.roles && $scope.user.roles.manager 	!== undefined && $scope.user.roles.manager 	!== null);

                if ($scope.user.isManager) {
                    $scope.user.roles.manager.department = getOnlyIds($scope.user.roles.manager.department);
                }
            });
        } else {

            // default user values

            $scope.user.isActive = true;
        }

        $scope.departments = Rest.admin.departments.getResource().query();

        /**
         * setImage modal popup
         */
        $scope.setImage = UserEdit.setImage($scope);

		$scope.cancel = function() {
            if ($scope.user._id) {
    			return $location.path('/admin/users/'+$scope.user._id);
            }
            $location.path('/admin/users');
		};

		/**
         * Save button
         */
		$scope.saveUser = function() {

			$scope.user.gadaSave()
            .then($scope.cancel);
	    };
	}];
});

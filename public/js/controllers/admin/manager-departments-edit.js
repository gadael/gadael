define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest', function(
			$scope,
			$location,
			Rest
		) {

		$scope.user = Rest.admin.users.getFromUrl().loadRouteId();

        if ($scope.user.$promise) {
            $scope.user.$promise.then(function() {
                if ($scope.user.roles && $scope.user.roles.manager && $scope.user.roles.manager._id) {

                    $scope.references = $scope.user.roles.manager.department || [];
                }
            });
        }


		$scope.cancel = function() {
			$location.path('/admin/users/'+$scope.user._id);
		};



		/**
         * Save button
         */
		$scope.saveManangerDepartments = function() {
            $scope.user.roles.manager.department = $scope.references;
            $scope.user.$save(function() {
                $scope.cancel();
            });
	    };



        /**
         * Add a row to account collection list
         */
		$scope.addAccountCollection = function() {
            $scope.references.push('');
		};




		/**
         * Delete
         */
		$scope.removeManagerDepartment = function(index) {
            var reference = $scope.references[index];

            if (undefined === reference._id || null === reference._id) {
                $scope.references.splice(index, 1);
                return;
            }

		};

	}];
});


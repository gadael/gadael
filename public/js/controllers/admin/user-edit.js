define([], function() {
    'use strict';
    
	return ['$scope', 
		'$location', 
		'Rest',
        '$modal',
        'UserEdit',
        function(
			$scope, 
			$location, 
			Rest,
            $modal,
            UserEdit
		) {

		$scope.user = Rest.admin.users.getFromUrl().loadRouteId();

        if ($scope.user.$promise) {
            $scope.user.$promise.then(function() {
                
                $scope.user.isAccount 	= ($scope.user.roles && $scope.user.roles.account 	!== undefined && $scope.user.roles.account 	!== null);
                $scope.user.isAdmin 	= ($scope.user.roles && $scope.user.roles.admin 	!== undefined && $scope.user.roles.admin 	!== null);
                $scope.user.isManager 	= ($scope.user.roles && $scope.user.roles.manager 	!== undefined && $scope.user.roles.manager 	!== null);

                if ($scope.user.isManager) {
                    $scope.user.roles.manager.department = $scope.user.roles.manager.department.map(function(d) {
                        return d._id;
                    });
                }
            });
        }
                
                
        $scope.departments = Rest.admin.departments.getResource().query();


        /**
         * setImage modal popup
         */
        $scope.setImage = UserEdit.setImage($scope);



		
		$scope.cancel = function() {
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


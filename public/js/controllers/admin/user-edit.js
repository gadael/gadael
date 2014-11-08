define([], function() {
    'use strict';
    
	return ['$scope', 
		'$location', 
		'Rest', 
        'loadDepartmentsOptions',
        function(
			$scope, 
			$location, 
			Rest,
            loadDepartmentsOptions 
		) {

		$scope.user = Rest.admin.users.getFromUrl().loadRouteId();

        if ($scope.user.$promise) {
            $scope.user.$promise.then(function() {
                
                $scope.user.isAccount 	= ($scope.user.roles && $scope.user.roles.account 	!== undefined && $scope.user.roles.account 	!== null);
                $scope.user.isAdmin 	= ($scope.user.roles && $scope.user.roles.admin 	!== undefined && $scope.user.roles.admin 	!== null);
                $scope.user.isManager 	= ($scope.user.roles && $scope.user.roles.manager 	!== undefined && $scope.user.roles.manager 	!== null);

            });
        }
                
                
        loadDepartmentsOptions($scope);

		
		$scope.cancel = function() {
			$location.path('/admin/users/'+$scope.user._id);
		};

		
		/**
         * Save button
         */
		$scope.saveUser = function() {
			$scope.user.ingaSave()
            .then($scope.cancel);
	    };

		
	}];
});


define([], function() {
    'use strict';
    
	return ['$scope', 
		'$location', 
		'IngaResource', 
		'$resource', function(
			$scope, 
			$location, 
			IngaResource, 
			$resource
		) {

		$scope.user = IngaResource('rest/admin/users').loadRouteId();

        if ($scope.user.$promise) {
            $scope.user.$promise.then(function() {
                
                $scope.user.isAccount 	= ($scope.user.roles && $scope.user.roles.account 	!== undefined && $scope.user.roles.account 	!== null);
                $scope.user.isAdmin 	= ($scope.user.roles && $scope.user.roles.admin 	!== undefined && $scope.user.roles.admin 	!== null);
                $scope.user.isManager 	= ($scope.user.roles && $scope.user.roles.manager 	!== undefined && $scope.user.roles.manager 	!== null);
                
                // after user resource loaded, load account Collections
                
                if ($scope.user.roles && $scope.user.roles.account && $scope.user.roles.account._id) {
                    $scope.accountCollections = accountCollection.query({ account: $scope.user.roles.account._id });
                } else {
                    $scope.accountCollections = [];
                }

            });
        }
		
		
		
		$scope.cancel = function() {
			$location.path('/admin/users');
		};
        
        
	    
	    var accountCollection = $resource('rest/admin/accountcollections/:accCollId',
            { accCollId:'@_id' }, 
            { 
                'save': { method:'PUT' },    // overwrite default save method (POST)
                'create': { method:'POST' }
            }  
        );

		
	}];
});


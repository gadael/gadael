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
        
                
        var beneficiaries = Rest.admin.beneficiaries.getResource();
        var accountCollection = Rest.admin.accountcollections.getResource();
        var accountScheduleCalendars = Rest.admin.accountschedulecalendars.getResource();

        if ($scope.user.$promise) {
            $scope.user.$promise.then(function() {
                
                $scope.user.isAccount 	= ($scope.user.roles && $scope.user.roles.account 	!== undefined && $scope.user.roles.account 	!== null);
                $scope.user.isAdmin 	= ($scope.user.roles && $scope.user.roles.admin 	!== undefined && $scope.user.roles.admin 	!== null);
                $scope.user.isManager 	= ($scope.user.roles && $scope.user.roles.manager 	!== undefined && $scope.user.roles.manager 	!== null);
                
                // after user resource loaded, load account Collections
                if (undefined !== $scope.user.roles && $scope.user.roles.account && $scope.user.roles.account._id) {
                    
                    var account = $scope.user.roles.account;
                    
                    $scope.accountRights = beneficiaries.query({ account: account._id });
                    $scope.accountCollections = accountCollection.query({ account: account._id });
                    $scope.accountScheduleCalendars = accountScheduleCalendars.query({ account: account._id });

                   
                } else {
                    $scope.accountRights = [];
                    $scope.accountCollections = [];
                    $scope.seniority_years = 0;
                }

                
                if (undefined !== $scope.user.roles && undefined !== $scope.user.roles.account && undefined !== $scope.user.roles.account.seniority) {

                    var seniority = new Date($scope.user.roles.account.seniority);
                    var today = new Date();
                    $scope.seniority_years = today.getFullYear() - seniority.getFullYear();
                }


            });
        }
		
		
		
		$scope.cancel = function() {
			$location.path('/admin/users');
		};
        
        
	    
	    
		
	}];
});


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
                    


                    $scope.accountScheduleCalendars = accountScheduleCalendars.query({ account: account._id });
                    $scope.accountCollections = accountCollection.query({ account: account._id });

                    $scope.accountCollections.$promise.then(function(collections) {
                        var today = new Date(), accountCollection;
                        for(var i=0; i<collections.length; i++) {
                            accountCollection = collections[i];
                            if (accountCollection.from <= today && (undefined === accountCollection.to || accountCollection.to > today)) {
                                $scope.currentCollection = accountCollection.rightCollection;
                                $scope.beneficiaries = beneficiaries.query({
                                    ref: 'RightCollection',
                                    document: accountCollection.rightCollection._id
                                });
                                break;
                            }
                        }
                    });
                   
                } else {
                    $scope.beneficiaries = [];
                    $scope.accountCollections = [];
                    $scope.seniority_years = 0;
                    $scope.currentCollection = {};
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


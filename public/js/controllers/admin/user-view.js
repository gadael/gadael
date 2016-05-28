define([], function() {
    'use strict';
    
	return ['$scope', 
		'$location', 
		'Rest',
        'gettext',
            function(
			$scope, 
			$location, 
			Rest,
            gettext
		) {

		$scope.user = Rest.admin.users.getFromUrl().loadRouteId();
        
                
        var accountBeneficiaries = Rest.admin.accountbeneficiaries.getResource();
        var accountCollection = Rest.admin.accountcollections.getResource();
        var accountScheduleCalendars = Rest.admin.accountschedulecalendars.getResource();
        var adjustmentsResource = Rest.admin.adjustments.getResource();

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
                    $scope.beneficiaries = accountBeneficiaries.query({ account: account._id });
                    $scope.adjustments = adjustmentsResource.query({ user: $scope.user._id });

                    var today = new Date();

                    if (undefined !== account.seniority) {
                        var seniority = new Date(account.seniority);
                        $scope.seniority_years = today.getFullYear() - seniority.getFullYear();
                    }

                    if (undefined !== account.birth) {
                        var birth = new Date(account.birth);
                        $scope.age = today.getFullYear() - birth.getFullYear();
                    }



                    $scope.beneficiaries.$promise.then(function() {
                        $scope.adjustments.$promise.then(function() {
                            for (var i=0; i< $scope.adjustments.length; i++) {
                                for (var j=0; j< $scope.beneficiaries.length; j++) {
                                    if ($scope.beneficiaries[j].right._id === $scope.adjustments[i].rightRenewal.right) {
                                        $scope.adjustments[i].rightRenewal.right = $scope.beneficiaries[j].right;
                                    }
                                }
                            }
                        });
                    });


                } else {
                    $scope.beneficiaries = [];
                    $scope.accountCollections = [];
                    $scope.seniority_years = 0;
                }

            });
        }

		
		
		$scope.cancel = function() {
			$location.path('/admin/users');
		};
        
        $scope.delete = function() {
            if (confirm(gettext('Are you sure you whant to delete this user?'))) {
                $scope.user.gadaDelete($location.path('/admin/users'));
            }
        };
	    
	    
		
	}];
});


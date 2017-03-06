define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        '$q',
        'catchOutcome',
        'saveUserBeneficiaries',
        'addPeriodRow', function(
			$scope,
			$location,
			Rest,
            $q,
            catchOutcome,
            saveUserBeneficiaries,
            addPeriodRow
		) {

		$scope.user = Rest.admin.users.getFromUrl().loadRouteId();

        if ($scope.user.$promise) {
            $scope.user.$promise.then(function() {

                // after user resource loaded, load account Collections

                if ($scope.user.roles && $scope.user.roles.account && $scope.user.roles.account._id) {
                    $scope.accountRights = beneficiaries.query(
                        { ref: 'User', document: $scope.user._id },
                        function() {

                            if (0 === $scope.accountRights.length) {
                                $scope.addAccountRight();
                            } else {

                                // force values as date object

                                for(var i=0; i<$scope.accountRights.length; i++) {
                                    if ($scope.accountRights[i].from) {
                                        $scope.accountRights[i].from = new Date($scope.accountRights[i].from);
                                    }

                                    if ($scope.accountRights[i].to) {
                                        $scope.accountRights[i].to = new Date($scope.accountRights[i].to);
                                    }
                                }
                            }
                        }
                    );

                    catchOutcome($scope.accountRights.$promise);

                } else {
                    $scope.accountRights = [];
                    $scope.addAccountRight();
                }
            });
        }

        $scope.rights = Rest.admin.rights.getResource().query({ forBeneficiaryRef: 'User' });

		$scope.cancel = function() {
			$location.path('/admin/users/'+$scope.user._id);
		};



		/**
         * Save button
         */
		$scope.saveBeneficiaries = function() {
            saveUserBeneficiaries($scope.accountRights, $scope.user._id).then($scope.cancel);
	    };

        /**
         * The beneficiaries ressource
         */
	    var beneficiaries = Rest.admin.beneficiaries.getResource();



        /**
         * Add a row to account collection list
         */
		$scope.addAccountRight = function() {
            addPeriodRow($scope, $scope.accountRights, beneficiaries, false);
		};




		$scope.removeIsDisabled = function(item) {
			if (undefined === item) {
				return false;
			}

			return (undefined !== item._id && item.from && item.from < Date.now());
		};


		/**
         * Delete
         */
		$scope.removeAccountRight = function(index) {
            var accountRight = $scope.accountRights[index];

            if (undefined === accountRight._id || null === accountRight._id) {
                $scope.accountRights.splice(index, 1);
                return;
            }

            var p = accountRight.$delete().then(function() {
                $scope.accountRights.splice(index, 1);
            });

            catchOutcome(p);
		};

	}];
});

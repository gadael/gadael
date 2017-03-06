define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        '$q',
        'catchOutcome',
        'saveAccountCollection',
        'addPeriodRow', function(
			$scope,
			$location,
			Rest,
            $q,
            catchOutcome,
            saveAccountCollection,
            addPeriodRow
		) {

		$scope.user = Rest.admin.users.getFromUrl().loadRouteId();

        if ($scope.user.$promise) {
            $scope.user.$promise.then(function() {

                // after user resource loaded, load account Collections

                if ($scope.user.roles && $scope.user.roles.account && $scope.user.roles.account._id) {
                    $scope.accountCollections = accountCollection.query(
                        { account: $scope.user.roles.account._id }, function() {
                            if (0 === $scope.accountCollections.length) {
                                $scope.addAccountCollection();
                            } else {

                                // force values as date object

                                for(var i=0; i<$scope.accountCollections.length; i++) {
                                    if ($scope.accountCollections[i].from) {
                                        $scope.accountCollections[i].from = new Date($scope.accountCollections[i].from);
                                    }

                                    if ($scope.accountCollections[i].to) {
                                        $scope.accountCollections[i].to = new Date($scope.accountCollections[i].to);
                                    }
                                }
                            }
                        }
                    );
                } else {
                    $scope.accountCollections = [];
                    $scope.addAccountCollection();
                }
            });
        }

        $scope.collections = Rest.admin.collections.getResource().query({ forBeneficiaryRef: 'RightCollection' });

		$scope.cancel = function() {
			$location.path('/admin/users/'+$scope.user._id);
		};



		/**
         * Save button
         */
		$scope.saveAccountCollections = function() {
            saveAccountCollection($scope).then($scope.cancel);
	    };

        /**
         * The account collection ressource
         */
	    var accountCollection = Rest.admin.accountcollections.getResource();



        /**
         * Add a row to account collection list
         */
		$scope.addAccountCollection = function() {
            addPeriodRow($scope, $scope.accountCollections, accountCollection);
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
		$scope.removeAccountCollection = function(index) {
            var accountCollection = $scope.accountCollections[index];

            if (undefined === accountCollection._id || null === accountCollection._id) {
                $scope.accountCollections.splice(index, 1);
                return;
            }

            var p = accountCollection.$delete().then(function() {
                $scope.accountCollections.splice(index, 1);
            });

            catchOutcome(p);
		};

	}];
});

define([], function() {

    'use strict';

	return ['$scope', '$location', 'Rest', 'catchOutcome', 'saveCollectionBeneficiaries',
    function($scope, $location, Rest, catchOutcome, saveCollectionBeneficiaries) {

		$scope.collection = Rest.admin.collections.getFromUrl().loadRouteId();

        var rights = Rest.admin.rights.getResource();
	    var beneficiaries = Rest.admin.beneficiaries.getResource();

        $scope.rights = rights.query();

        if ($scope.collection.$promise) {
            $scope.collection.$promise.then(function(collection) {
                $scope.collectionRights = beneficiaries.query(
                    { document: collection._id , ref: 'RightCollection' }, function() {
                    if (0 === $scope.collectionRights.length) {
                        $scope.addRight();
                    }
                });

                catchOutcome($scope.collectionRights.$promise);
            });
        }

        $scope.collectionRights = [];

        $scope.addRight = function() {
            $scope.collectionRights.push(new beneficiaries());
        };

        /**
         * Delete
         */
		$scope.removeRight = function(index) {
            var right = $scope.collectionRights[index];

            if (undefined === right._id || null === right._id) {
                $scope.collectionRights.splice(index, 1);
                return;
            }

            catchOutcome(right.$delete())
            .then(function() {
                $scope.collectionRights.splice(index, 1);
            });
		};

		$scope.back = function() {
			$location.path('/admin/collections');
		};

		$scope.saveCollection = function() {
			$scope.collection.gadaSave(function(collection) {
                return saveCollectionBeneficiaries($scope.collectionRights, collection._id);
            })
            .then($scope.back)
            .catch(console.log);
	    };
	}];
});

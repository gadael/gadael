define([], function() {
    'use strict';

    /**
     * Get collections needed for controller
     * current, previous, next
     * @param {Array} accountCollections
     * @return {Object}
     */
    function getCollections(accountCollections) {

        var r = {
            prev: null,
            current: null,
            next: null
        };

        var today = new Date();

        for (var i=0; i<accountCollections.length; i++) {
            if (accountCollections[i].from < today && accountCollections[i].to > today) {

                if (i > 0) {
                    r.prev = accountCollections[i-1];
                }
                r.current = accountCollections[i];
                if (i+1 < accountCollections.length) {
                    r.next = accountCollections[i+1];
                }

                return r;
            }
        }

        // not found in interval, then the last configured collection will be used

        var last = accountCollections.length -1;
        if (last > 0) {
            r.prev = accountCollections[last-1];
        }
        r.current = accountCollections[last];

        return r;
    }



	return [
        '$scope',
        '$location',
		'Rest',
        function(
			$scope,
            $location,
			Rest
		) {

        var accountCollectionResource = Rest.admin.accountcollections.getResource();

		$scope.user = Rest.admin.users.getFromUrl().loadRouteId();


        if ($scope.user.$promise) {
            $scope.user.$promise.then(function() {
                if (undefined !== $scope.user.roles && $scope.user.roles.account && $scope.user.roles.account._id) {

                    var account = $scope.user.roles.account;
                    var accountCollections = accountCollectionResource.query({ account: account._id });

                    accountCollections.$promise.then(function() {
                        $scope.accountCollections = getCollections(accountCollections);
                        console.log($scope.accountCollections);
                    });
                }

            });
        }



		$scope.cancel = function() {
			$location.path('/admin/users/'+$scope.user._id);
		};


		/**
         * Save button
         */
		$scope.save = function() {
            $scope.user.ingaSave().then($scope.cancel);
	    };

	}];
});


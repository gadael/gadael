define([], function() {
    'use strict';

    /**
     * Get collections needed for controller
     * current, previous, next
     * @param {Array} accountCollections
     * @return {Object}
     */
    function getCollections(accountCollections, refDate) {

        var r = {
            prev: null,
            current: null,
            next: null
        };

        if (!refDate) {
            refDate = new Date();
        }

        for (var i=0; i<accountCollections.length; i++) {
            if (accountCollections[i].from < refDate && accountCollections[i].to > refDate) {

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
        var accoutBeneficiariesResource = Rest.admin.accountbeneficiaries.getResource();
        var account, accountCollections;

		$scope.user = Rest.admin.users.getFromUrl().loadRouteId();

        function setAccountCollection(accountCollections, refDate) {
            $scope.accountCollections = getCollections(accountCollections, refDate);
            var collection = $scope.accountCollections.current;
            var accoutBeneficiaries = accoutBeneficiariesResource.query({ account: account._id });

            accoutBeneficiaries.$promise.then(function() {
                $scope.beneficiaries = [];
                var today = new Date();
                accoutBeneficiaries.forEach(function(b) {

                    for(var r = b.renewals.length; r--;) {
                        if (b.renewals[r].start > collection.to || b.renewals[r].finish < collection.from) {
                            // filter out renewals out of collection period
                            b.renewals.splice(r, 1);
                        }

                        if (b.renewals[r].finish < today && b.renewals[r].available_quantity <= 0) {
                            // filter out finished renewals with no remaining quantity
                            b.renewals.splice(r, 1);
                        }
                    }

                    if (0 === b.renewals.length) {
                        // do not display rights with no renewals
                        return;
                    }

                    $scope.beneficiaries.push(b);
                });
            });
        }

        if ($scope.user.$promise) {
            $scope.user.$promise.then(function() {
                if (undefined !== $scope.user.roles && $scope.user.roles.account && $scope.user.roles.account._id) {

                    account = $scope.user.roles.account;
                    accountCollections = accountCollectionResource.query({ account: account._id });

                    accountCollections.$promise.then(function() {
                        setAccountCollection(accountCollections);
                    });
                }

            });
        }


        /**
         * Previous account-collection
         */
        $scope.prev = function() {
            var refDate = new Date($scope.accountCollections.prev.from);
            refDate.setDate(refDate.getDate()+1);
            setAccountCollection(accountCollections, refDate);
        };

        /**
         * Next account-collection
         */
        $scope.next = function() {
            setAccountCollection(accountCollections, $scope.accountCollections.next.from);
        };


		/**
		 * Get back to user view
		 */
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


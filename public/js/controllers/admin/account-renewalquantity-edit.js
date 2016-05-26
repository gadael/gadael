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




    /**
     * Remove renewals if they must not appear in the view
     * @param {Array} renewals list of the renewal in a right object
     * @param {Object} collection
     */
    function filterInvalidRenewals(renewals, collection)
    {
        var today = new Date();

        for(var r = renewals.length; r--;) {
            if (renewals[r].start > collection.to || renewals[r].finish < collection.from) {
                // filter out renewals out of collection period
                renewals.splice(r, 1);
                continue;
            }

            renewals[r].position = 0;

            if (renewals[r].finish < today) {
                // filter out finished renewals with no remaining quantity

                if (renewals[r].available_quantity <= 0) {
                    renewals.splice(r, 1);
                    continue;
                } else {
                    renewals[r].position = -1;
                }
            }


            if (renewals[r].start > today) {
                renewals[r].position = 1;
            }
        }

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

                accoutBeneficiaries.forEach(function(b) {

                    filterInvalidRenewals(b.renewals, collection);

                    if (0 === b.renewals.length) {
                        // do not display rights with no renewals
                        return;
                    }

                    b.renewals.sort(function(r1, r2) {
                        return r1.start < r2.start;
                    });

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


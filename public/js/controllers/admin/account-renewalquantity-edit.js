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
            var rightTest = collection.to ? renewals[r].start > collection.to : false;
            if (rightTest || renewals[r].finish < collection.from) {
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

            if (null === renewals[r].initial_quantity) {
                renewals.splice(r, 1);
                continue;
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
        '$q',
        function(
			$scope,
            $location,
			Rest,
            $q
		) {

        var accountCollectionResource = Rest.admin.accountcollections.getResource();
        var accoutBeneficiariesResource = Rest.admin.accountbeneficiaries.getResource();
        var adjustmentResource = Rest.admin.adjustments.getResource();

        var account, accountCollections, adjustments, newAdjustments = [];

        /**
         * store a copy of renewal initial quantity on service loaded
         * Used to check differences and build adjustments
         */
        var collectionRenewalQuantity = {};


		$scope.user = Rest.admin.users.getFromUrl().loadRouteId();


        /**
         * get adjustment sum for one renewal
         * @param   {object}  renewal [[Description]]
         * @returns {boolean} [[Description]]
         */
        function getAdjustmentSum(renewal) {

            var totalAdjustment = 0;

            for (var i=0; i<adjustments.length; i++) {
                if (adjustments[i].rightRenewal._id === renewal._id) {
                    totalAdjustment += adjustments[i].quantity;
                }
            }

            return totalAdjustment;
        }


        /**
         * Test if a renwal is in the adjustments to save
         * @param   {object}  renewal [[Description]]
         * @returns {boolean} [[Description]]
         */
        function inNewAdjustments(renewal) {
            for (var i=0; i<newAdjustments.length; i++) {
                if (newAdjustments[i].rightRenewal._id === renewal._id) {
                    return true;
                }
            }

            return false;
        }

        /**
         * If an input is set to the unmodified value, the adjustment is removed from the new adjustment list
         * @param   {object}   renewal [[Description]]
         * @returns {[[Type]]} [[Description]]
         */
        function removeFromNewAdjustments(renewal) {
            newAdjustments = newAdjustments.filter(function(a) {
                return (a.rightRenewal._id !== renewal._id);
            });
        }


        /**
         * If an input contain a value different from the value loaded from the server
         *
         * @param {object} renewal  [[Description]]
         * @param {Number} quantity [[Description]]
         * @param {object} beneficiary
         */
        function setNewAdjustment(renewal, quantity, beneficiary) {

            removeFromNewAdjustments(renewal);

            var adjustment = new adjustmentResource();

            adjustment.user = $scope.user._id;
            adjustment.rightRenewal = renewal;
            adjustment.quantity = quantity;
            adjustment.comment = null;  // must be set on save
            adjustment.beneficiary = beneficiary._id;
            newAdjustments.push(adjustment);
        }





        /**
         * On collection change, when arrow are used if any
         * @param   {object}   accountCollections List of all account collections periods
         * @param   {Date}     refDate            A date in the collection period used to match the collection
         *
         */
        function setAccountCollection(accountCollections, refDate) {
            $scope.accountCollections = getCollections(accountCollections, refDate);
            var collection = $scope.accountCollections.current;
            var accoutBeneficiaries = accoutBeneficiariesResource.query({ account: account._id, date: collection.from });

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

                    b.renewals.forEach(function(r) {
                        collectionRenewalQuantity[r._id] = r.initial_quantity;
                    });


                    $scope.beneficiaries.push(b);
                });

                $scope.beneficiairesLoaded = true;
            });
        }




        if ($scope.user.$promise) {
            $scope.user.$promise.then(function() {
                if (undefined !== $scope.user.roles && $scope.user.roles.account && $scope.user.roles.account._id) {

                    account = $scope.user.roles.account;
                    accountCollections = accountCollectionResource.query({ account: account._id });
                    adjustments = adjustmentResource.query({ user: $scope.user._id });

                    accountCollections.$promise.then(function() {
                        setAccountCollection(accountCollections);
                    });

                }

            });
        }




        /**
         * When initial quantity is modified, create a list of adjustments to save
         */
        $scope.$watch('beneficiaries', function(beneficiaries) {
            if (!beneficiaries) {
                return;
            }

            beneficiaries.forEach(function(beneficiary) {
                beneficiary.renewals.forEach(function(renewal) {
                    if (collectionRenewalQuantity[renewal._id] !== renewal.initial_quantity) {
                        var quantity = renewal.initial_quantity - collectionRenewalQuantity[renewal._id];
                        setNewAdjustment(renewal, quantity, beneficiary);
                        return;
                    }

                    removeFromNewAdjustments(renewal);
                });
            });
        }, true);


        /**
         * Test if the initial quantity of renewal is modified by adjustments for this user
         *
         * @param   {object} renewal [[Description]]
         * @returns {boolean} [[Description]]
         */
        $scope.isModified = function(renewal) {

            if (inNewAdjustments(renewal)) {
                return true;
            }

            return (0 !== getAdjustmentSum(renewal));
        };


        /**
         * Tooltip to get the unmodified quantity, only if modified
         * @param   {object} renewal [[Description]]
         * @returns {string} [[Description]]
         */
        $scope.getUnmodifiedQuantity = function(renewal) {
            return renewal.initial_quantity - getAdjustmentSum(renewal);
        };


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

            var promises = [];

            newAdjustments.forEach(function(adjustment) {
                promises.push(adjustment.$create());
            });

            $q.all(promises).then($scope.cancel);
	    };

	}];
});

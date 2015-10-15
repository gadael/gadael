define(['q', 'async'], function(Q, async) {

    'use strict';









	return [
        '$scope',
        '$location',
        '$routeParams',
        'Rest',
        '$modal',
        'catchOutcome',
        'gettext',
        'decimalAdjust',
        function($scope, $location, $routeParams, Rest, $modal, catchOutcome, gettext, decimalAdjust) {





        /**
         * Create graph values
         *
         * @param {array} renewals
         * @param {Promise} requestsPromise
         * @param {function} next
         *
         *
         */
        function createGraphValues(renewals, requestsPromise, next)
        {
            var history = [];

            function round(x) {
                return decimalAdjust('round', x, -1);
            }

            /**
             * renewals and adjustements by date
             */
            function buildRenewalsWithAdjustments() {

                var deferred = Q.defer();
                var lastRenewalId = renewals[renewals.length-1]._id;

                renewals.forEach(function(r) {


                    history.push({
                        position: r.start,
                        add: round(r.initial_quantity)
                    });

                    // process monthly update adjustments

                    if (undefined !== r.adjustments) {
                        r.adjustments.forEach(function(adjustment) {
                            history.push({
                                position: adjustment.from,
                                add: round(adjustment.quantity)
                            });
                        });
                    }

                    // process manual adjustments

                    r.adjustmentPromise.then(function(adjustments) {
                        adjustments.forEach(function(adjustment) {
                            history.push({
                                position: adjustment.timeCreated,
                                add: round(adjustment.quantity)
                            });
                        });

                        if (0 === adjustments.length || adjustments[0].rightRenewal === lastRenewalId) {
                            deferred.resolve();
                        }
                    });
                });

                return deferred.promise;
            }


            function getElem(request)
            {
                if (undefined === request.absence || undefined === request.absence.distribution) {
                    return null;
                }

                var elem;
                for(var i=0; i<request.absence.distribution.length; i++) {
                    elem = request.absence.distribution[i];
                    if (elem.right.id === renewals[0].right._id) {
                        return elem;
                    }
                }

                return null;
            }


            /**
             * requests by date
             */
            function buildRequests() {
                var deferred = Q.defer();

                requestsPromise.then(function(requests) {
                    requests.forEach(function(r) {
                        var elem = getElem(r);
                        if (null === elem) {
                            return;
                        }

                        history.push({
                            position: r.timeCreated,
                            add: (-1 * elem.consumedQuantity)
                        });
                    });

                    deferred.resolve();
                });

                return deferred.promise;
            }




            Q.all([buildRenewalsWithAdjustments(), buildRequests()]).then(function() {

                history.sort(function (a, b) {
                    if (a.position > b.position) {
                        return 1;
                    }
                    if (a.position < b.position) {
                        return -1;
                    }
                    return 0;
                });

                var graph = [];
                var current_quantity = 0;
                history.forEach(function(element) {
                    current_quantity += element.add;
                    graph.push([element.position, current_quantity]);
                });

                next(graph);
            });
        }





        /**
         * Create the combinedAdjustments list on a renewal object
         * @param {Object} renewal
         * @param {Array} adjustments   Manual adjustments created for this user
         */
        function createCombinedAdjustments(renewal, adjustments)
        {
            renewal.combinedAdjustments = [];

            // Combine adjustments with renewal.adjustments

            if (undefined !== renewal.adjustments) {
                for(var i=0; i<renewal.adjustments.length; i++) {
                    renewal.combinedAdjustments.push({
                        from: renewal.adjustments[i].from,
                        quantity: renewal.adjustments[i].quantity,
                        comment: gettext('Auto monthly update')
                    });
                }
            }

            adjustments.forEach(function(manualAdjustment) {
                manualAdjustment.from = manualAdjustment.timeCreated;
                renewal.combinedAdjustments.push(manualAdjustment);
            });

            renewal.combinedAdjustments.sort(function(a1, a2) {
                return (a1.from.getTime() - a2.from.getTime());
            });

        }


        var userResource = Rest.admin.users.getResource();
        var accountbeneficiaryResource = Rest.admin.accountbeneficiaries.getResource();
        var adjustmentResource = Rest.admin.adjustments.getResource();
        var requestResource = Rest.admin.requests.getResource();



        if (!$location.search().user) {
            throw new Error('The user parameter is mandatory');
        }



        var requests = requestResource.query({
            'user.id': $location.search().user,
            absence: true
        });

        $scope.user = userResource.get({id: $location.search().user});

        $scope.user.$promise.then(function() {
            var beneficiaryContainer = accountbeneficiaryResource.get({
                id: $routeParams.id,
                account: $scope.user.roles.account._id
            });

            beneficiaryContainer.$promise.then(function(beneficiary) {

                var now = new Date();

                var panel = 0;

                // for each renewals, add the list of adjustments

                async.each(beneficiary.renewals, function(r, nextRenewal) {

                    r.paneltype = 'default';

                    if (r.start < now && r.finish > now) {
                        $scope.activePanel = panel;
                        r.paneltype = 'primary';
                    }

                    panel++;

                    var adjustments = adjustmentResource.query({ rightRenewal: r._id, user: $scope.user._id }, function() {
                        createCombinedAdjustments(r, adjustments);
                        nextRenewal();
                    });

                    r.adjustmentPromise = adjustments.$promise;


                }, function endRenewals() {


                    $scope.beneficiary = beneficiary;



                    createGraphValues(beneficiary.renewals, requests.$promise, function(values) {
                        $scope.timedAvailableQuantity = [{
                            "key": "Available quantity",
                            "values": values
                        }];
                    });
                });






            });


        });





        $scope.xAxisTickFormat_Date_Format = function() {
            return function(d){
                return (new Date(d)).toLocaleDateString();
            };
        };




		$scope.back = function back() {
			$location.path('/admin/users/'+$scope.user._id);
		};

        $scope.addAdjustment = function addAdjustment(renewal) {
            var modalscope = $scope.$new();

            modalscope.renewal = renewal;

            modalscope.adjustment = new adjustmentResource();

            modalscope.adjustment.rightRenewal = renewal._id;
            modalscope.adjustment.user = $scope.user._id;
            modalscope.adjustment.quantity = 0;
            modalscope.adjustment.comment = '';

            modalscope.adjustment.available_quantity = renewal.available_quantity;


            modalscope.setAdjustmentQuantity = function setAdjustmentQuantity() {
                modalscope.adjustment.available_quantity = renewal.available_quantity + modalscope.adjustment.quantity;
            };

            modalscope.setAvailableQuantity = function setAvailableQuantity() {
                modalscope.adjustment.quantity = modalscope.adjustment.available_quantity - renewal.available_quantity;
            };

            var modal = $modal({
                scope: modalscope,
                template: 'partials/admin/adjustment-edit.html',
                show: true
            });


            modalscope.cancel = function() {
                modal.hide();
            };

            modalscope.save = function() {
                catchOutcome(modalscope.adjustment.$create()).then(modal.hide);
            };
        };

	}];
});

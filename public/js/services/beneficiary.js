define(['q', 'async'], function(Q, async) {

    'use strict';


    return function init(decimalAdjust, gettext) {


        /**
         * Create graph values
         *
         * @param {array} renewals
         * @param {Promise} requestsPromise
         *
         * @return {Promise}
         *
         *
         */
        function createGraphValues(renewals, requestsPromise)
        {
            var history = [];

            function round(x) {
                return decimalAdjust('round', x, -1);
            }

            /**
             * renewals and adjustements by date
             */
            function buildRenewalsWithAdjustments() {


                if (renewals.length <= 0) {
                    return Q.resolve(true);
                }

                var promises = [];

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

                    promises.push(r.adjustmentPromise);

                });


                return Q.all(promises)
                .then(function(adjustmentsList) {
                    var adjustments = adjustmentsList.reduce(function(a, b) {
                        return a.concat(b);
                    }, []);

                    adjustments.forEach(function(adjustment) {
                        history.push({
                            position: adjustment.timeCreated,
                            add: round(adjustment.quantity)
                        });
                    });

                    return true;
                });


            }


            /**
             * @param {Object} request
             */
            function getElem(request)
            {
                if (0 === renewals.length) {
                    return null;
                }

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
             * @param {Object} request
             */
            function getDeposit(request)
            {
                if (undefined === request.time_saving_deposit || 1 !== request.time_saving_deposit.length) {
                    return null;
                }

                return request.time_saving_deposit[0];
            }



            /**
             * requests by date
             */
            function buildRequests() {


                /**
                 * Add all valid interval of the request to the graph dates
                 * @param {Object} request
                 * @param {Number} quantity
                 */
                function addHistoryQuantity(request, quantity)
                {
                    if (undefined === request.validInterval) {
                        return;
                    }

                    request.validInterval.forEach(function(validInterval) {

                        history.push({
                            position: validInterval.start,
                            add: quantity
                        });

                        if (null !== validInterval.finish) {
                            history.push({
                                position: validInterval.start,
                                add: (-1 *quantity)
                            });
                        }

                    });


                }


                return requestsPromise.then(function(requests) {
                    requests.forEach(function(r) {

                        var elem = getElem(r);
                        if (null !== elem) {
                            addHistoryQuantity(r, (-1 * elem.consumedQuantity));
                        }

                        var deposit = getDeposit(r);
                        if (null !== deposit) {
                            addHistoryQuantity(r, deposit.quantity);
                        }

                    });

                    return true;
                });
            }




            return Q.all([
                buildRenewalsWithAdjustments(),
                buildRequests()
            ])
            .then(function() {

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

                return graph;
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



        /**
         * prepare panels for each renewals
         * prepare graph values
         *
         * @param {Scope} $scope
         * @param beneficiaryContainer
         * @param requests                  absences to be subtracted on quantity
         *                                  time saving deposits to be added on quantity (for time saving account)
         * @param adjustmentResourceQuery
         *
         */
        function processBeneficiary($scope, beneficiaryContainer, requests, adjustmentResourceQuery)
        {
            beneficiaryContainer.$promise.then(function onLoadBeneficiary(beneficiary) {


                var now = new Date();

                var panel = 0;

                var errors = beneficiary.errors.map(function(err) {
                    return err.renewal._id;
                });


                // for each renewals, add the list of adjustments

                async.each(beneficiary.renewals, function(r, nextRenewal) {

                    r.paneltype = 'default';

                    if (r.start < now && r.finish > now) {
                        $scope.activePanel = panel;
                        r.paneltype = 'primary';
                    }

                    panel++;

                    var adjustments = adjustmentResourceQuery(r._id, function() {
                        createCombinedAdjustments(r, adjustments);
                        nextRenewal();
                    });

                    r.adjustmentPromise = adjustments.$promise;



                }, function endRenewals() {

                    // remove renewals displayed as errors
                    beneficiary.renewals = beneficiary.renewals.filter(function(renewal) {
                        return (-1 === errors.indexOf(renewal._id));
                    });


                    $scope.beneficiary = beneficiary;

                    if (beneficiary.available_quantity === null) {
                        // No graph if unlimited right
                        return;
                    }

                    createGraphValues(beneficiary.renewals, requests.$promise)
                    .then(function(values) {
                        $scope.timedAvailableQuantity = [{
                            "key": gettext('Available quantity'),
                            "values": values
                        }];
                    });
                });

            });
        }



        return {
            createGraphValues: createGraphValues,
            processBeneficiary: processBeneficiary,
            xAxisTickFormat_Date_Format: function() {
                return function(d){
                    return (new Date(d)).toLocaleDateString();
                };
            }
        };
    };

});

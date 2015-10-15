define(['q'], function(Q) {

    'use strict';


    return function init(decimalAdjust) {


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




        return {
            createGraphValues: createGraphValues
        };
    };

});

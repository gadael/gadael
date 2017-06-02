define(function() {

    'use strict';



    /**
     * Prepare scope variables for departments visualization
     */
    return function createRenewalChart(gettextCatalog, $filter) {

        return function renewalChart($scope, beneficiariesResource)
        {
            $scope.renewalChart = {

                availableHours: 0,
                availableDays: 0,

                percentDays: 0,
                percentHours: 0,

                hours: [],
                days: [],

                xFunction: function() {
                    return function(d) {
                        return d.right.name;
                    };
                },
                yFunction: function() {
                    return function(d) {
                        return (d.available_quantity);
                    };
                },
                colorFunction: function() {
                    return function(d) {
                        return d.data.right.type.color;
                    };
                },
                toolTipContentFunction: function() {
                    return function(key, quantity, obj) {
                        return '<div>' + key + '</div>' +
                            '<p>' +  $filter('number')(quantity) +
                            ' '+obj.point.available_quantity_dispUnit + '</p>';
                    };
                }
            };

            var beneficiariesQuery = beneficiariesResource.query({});

            beneficiariesQuery.$promise.then(function(beneficiaries) {


                var totalHours = 0;
                var totalDays = 0;
                var consumedHours = 0;
                var consumedDays = 0;



                /**
                 * Items to display in day charts
                 */
                var days = [];

                /**
                 * contain renewal finish date and list of beneficiaries
                 * for reach different renewal finish date
                 */
                var renewals = {};





                /**
                 * Populate beneficiaries by current renewal finish date
                 * into the renewals
                 * @param {Object} beneficiary
                 */
                function addRenewalIndex(beneficiary) {
                    var now = new Date();
                    var flist = beneficiary.renewals.filter(function(r) {
                        if (now >= r.start && now <= r.finish) {
                            return true;
                        }
                        return false;
                    });

                    if (1 !== flist.length) {
                        return null;
                    }

                    var renewal = flist[0];
                    var key;

                    if (!$scope.useEndDate(renewal)) {
                        key = 'INF';
                    } else {
                        key = renewal.finish.toString();
                    }



                    if (undefined === renewals[key]) {
                        renewals[key] = {
                            finish: renewal.finish,
                            beneficiaries: []
                        };
                    }

                    renewals[key].beneficiaries.push(beneficiary);
                }


                var i, b;

                for(i=0; i<beneficiaries.length; i++) {

                    b= beneficiaries[i];

                    if (b.errors.length > 0) {
                        // ignore beneficiaries with errors
                        continue;
                    }

                    addRenewalIndex(b);


                    switch(beneficiaries[i].right.quantity_unit) {
                        case 'H':
                            $scope.renewalChart.availableHours += b.available_quantity;
                            consumedHours += b.consumed_quantity;
                            totalHours += b.initial_quantity;
                            days.push(b);
                            break;

                        case 'D':
                            $scope.renewalChart.availableDays += b.available_quantity;
                            consumedDays += b.consumed_quantity;
                            totalDays += b.initial_quantity;
                            days.push(b);
                            break;
                    }
                }


                function removeHidden(b) {
                    return !b.right.hide;
                }


                var sortedRenewals = [];
                for(var k in renewals) {
                    if (renewals.hasOwnProperty(k)) {
                        renewals[k].beneficiaries = renewals[k].beneficiaries.filter(removeHidden);
                        if (renewals[k].beneficiaries.length > 0) {
                            sortedRenewals.push(renewals[k]);
                        }
                    }
                }

                // list of active renewals, the first finishing first

                sortedRenewals.sort(function(r1, r2) {
                    if (r1.finish < r2.finish) {
                        return -1;
                    }

                    if (r1.finish > r2.finish) {
                        return 1;
                    }

                    return 0;
                });


                $scope.renewals = sortedRenewals;

                var consumedRight = {
                            name: gettextCatalog.getString('Consumed'),
                            type: {
                                color:'#ddd'
                            }
                        };


                if (consumedDays > 0) {
                    days.push({
                        available_quantity: consumedDays,
                        available_quantity_dispUnit: gettextCatalog.getPlural(consumedDays, 'Day', 'Days'),
                        right: consumedRight
                    });
                }

                $scope.renewalChart.days = days;
                $scope.renewalChart.percentDays = Math.round(consumedDays*100/totalDays);
            });
        };

    };

});

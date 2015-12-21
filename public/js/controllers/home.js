define([], function() {
        
    'use strict';
    
	return ['$scope', 'Rest', '$q', 'gettextCatalog', '$filter', 'departmentDays',
            function($scope, Rest, $q, gettextCatalog, $filter, departmentDays) {

        var collaboratorsResource;
        var calendareventsResource;



        if ($scope.sessionUser.isAccount) {

            var beneficiariesResource = Rest.account.beneficiaries.getResource();
            collaboratorsResource = Rest.account.collaborators.getResource();
            calendareventsResource = Rest.account.calendarevents.getResource();


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
                        return d.available_quantity;
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
                 * Items to display in hour chart
                 */
                var hours = [];

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

                    var key = renewal.finish.toString();

                    if (undefined === renewals[key]) {
                        renewals[key] = {
                            finish: renewal.finish,
                            beneficiaries: []
                        };
                    }

                    renewals[key].beneficiaries.push(beneficiary);
                }




                for(var i=0; i<beneficiaries.length; i++) {

                    addRenewalIndex(beneficiaries[i]);


                    switch(beneficiaries[i].right.quantity_unit) {
                        case 'H':
                            $scope.renewalChart.availableHours += beneficiaries[i].available_quantity;
                            consumedHours += beneficiaries[i].consumed_quantity;
                            totalHours += beneficiaries[i].initial_quantity;
                            hours.push(beneficiaries[i]);
                            break;

                        case 'D':
                            $scope.renewalChart.availableDays += beneficiaries[i].available_quantity;
                            consumedDays += beneficiaries[i].consumed_quantity;
                            totalDays += beneficiaries[i].initial_quantity;
                            days.push(beneficiaries[i]);
                            break;
                    }
                }


                var sortedRenewals = [];
                for(var k in renewals) {
                    if (renewals.hasOwnProperty(k)) {
                        sortedRenewals.push(renewals[k]);
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
                            name: 'Consumed',
                            type: {
                                color:'#ccc'
                            }
                        };


                if (consumedHours > 0) {
                    hours.push({
                        available_quantity: consumedHours,
                        available_quantity_dispUnit: gettextCatalog.getPlural(consumedHours, 'Hour', 'Hours'),
                        right: consumedRight
                    });
                }

                if (consumedDays > 0) {
                    days.push({
                        available_quantity: consumedDays,
                        available_quantity_dispUnit: gettextCatalog.getPlural(consumedDays, 'Day', 'Days'),
                        right: consumedRight
                    });
                }

                $scope.renewalChart.hours = hours;
                $scope.renewalChart.percentHours = Math.round(consumedHours*100/totalHours);

                $scope.renewalChart.days = days;
                $scope.renewalChart.percentDays = Math.round(consumedDays*100/totalDays);
            });


        }


		
        if ($scope.sessionUser.isManager) {
            // load waiting requests

            var waitingRequestResource = Rest.manager.waitingrequests.getResource();
            collaboratorsResource = Rest.manager.collaborators.getResource();
            calendareventsResource = Rest.manager.calendarevents.getResource();

            $scope.waitingrequests = waitingRequestResource.query();
        }


        if ($scope.sessionUser.department) {
            departmentDays($scope, collaboratorsResource, calendareventsResource, 14);
        }

	}];
});

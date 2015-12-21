define([], function() {
        
    'use strict';
    
	return ['$scope', 'Rest', '$q', 'gettextCatalog', '$filter', function($scope, Rest, $q, gettextCatalog, $filter) {

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


            var startDate = new Date();
            startDate.setHours(0,0,0,0);
            var endDate = new Date(startDate);
            var nbdays = 14;
            endDate.setDate(endDate.getDate() + nbdays);

            $scope.collaborators = collaboratorsResource.query({
                dtstart: startDate,
                dtend: endDate
            });


            var nonworkingdaysQuery = calendareventsResource.query({
                type: 'nonworkingday',
                dtstart: startDate,
                dtend: endDate
            });


            $q.all([$scope.collaborators.$promise, nonworkingdaysQuery.$promise]).then(function(results) {

                var collaborators = results[0];
                var nonworkingdays = results[1];

                for(var c=0; c<collaborators.length; c++) {

                    var collaborator = collaborators[c];

                    collaborator.days = {};
                    var loopDate = new Date();

                    loopDate.setHours(0,0,0,0);

                    for (var d=0; d<nbdays; d++) {

                        collaborator.days[loopDate.getTime()] = {
                            date: new Date(loopDate),
                            free: false,
                            events: [],
                            nonworkingday: null
                        };


                        loopDate.setDate(loopDate.getDate()+1);
                    }

                    var event, pos;



                    for (var f=0; f<collaborator.free.length; f++) {
                        event = collaborator.free[f];
                        pos = new Date(event.dtstart);
                        pos.setHours(0,0,0,0);

                        if (undefined === collaborator.days[pos.getTime()]) {
                            continue;
                        }

                        collaborator.days[pos.getTime()].free = true;
                    }

                    for (var e=0; e<collaborator.events.length; e++) {
                        event = collaborator.events[e];
                        pos = new Date(event.dtstart);
                        pos.setHours(0,0,0,0);

                        if (undefined === collaborator.days[pos.getTime()]) {
                            continue;
                        }

                        collaborator.days[pos.getTime()].events.push(event);
                    }


                    for (var n=0; n<nonworkingdays.length; n++) {
                        event = nonworkingdays[n];
                        pos = new Date(event.dtstart);
                        pos.setHours(0,0,0,0);

                        if (undefined === collaborator.days[pos.getTime()]) {
                            continue;
                        }

                        collaborator.days[pos.getTime()].free = false;
                        collaborator.days[pos.getTime()].nonworkingday = event;
                    }
                }
            });
        }

	}];
});

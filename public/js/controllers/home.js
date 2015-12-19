define([], function() {
        
    'use strict';
    
	return ['$scope', 'Rest', '$q', function($scope, Rest, $q) {

        var collaboratorsResource;
        var calendareventsResource;



        if ($scope.sessionUser.isAccount) {

            var beneficiariesResource = Rest.account.beneficiaries.getResource();
            collaboratorsResource = Rest.account.collaborators.getResource();
            calendareventsResource = Rest.account.calendarevents.getResource();


            $scope.renewalChart = {

                availableHours: 0,
                availableDays: 0,

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

            };

            var beneficiariesQuery = beneficiariesResource.query({});

            beneficiariesQuery.$promise.then(function(beneficiaries) {
                var consumedHours = 0;
                var consumedDays = 0;

                var hours = [];
                var days = [];


                for(var i=0; i<beneficiaries.length; i++) {
                    switch(beneficiaries[i].right.quantity_unit) {
                        case 'H':
                            $scope.renewalChart.availableHours += beneficiaries[i].available_quantity;
                            consumedHours += beneficiaries[i].consumed_quantity;
                            hours.push(beneficiaries[i]);
                            break;

                        case 'D':
                            $scope.renewalChart.availableDays += beneficiaries[i].available_quantity;
                            consumedDays += beneficiaries[i].consumed_quantity;
                            days.push(beneficiaries[i]);
                            break;
                    }
                }

                if (consumedHours > 0) {
                    hours.push({
                        available_quantity: consumedHours,
                        right: {
                            name: 'Consumed',
                            type: {
                                color:'#ccc'
                            }
                        }
                    });
                }

                if (consumedDays > 0) {
                    days.push({
                        available_quantity: consumedDays,
                        right: {
                            name: 'Consumed',
                            type: {
                                color:'#ccc'
                            }
                        }
                    });
                }

                $scope.renewalChart.hours = hours;
                $scope.renewalChart.days = days;
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

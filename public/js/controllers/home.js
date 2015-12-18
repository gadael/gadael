define([], function() {
        
    'use strict';
    
	return ['$scope', 'Rest', '$q', function($scope, Rest, $q) {
		
        if ($scope.sessionUser.isManager) {
            // load waiting requests

            var waitingRequestResource = Rest.manager.waitingrequests.getResource();
            $scope.waitingrequests = waitingRequestResource.query();

        }


        if ($scope.sessionUser.department) {
            var collaboratorsResource = Rest.account.collaborators.getResource();

            var startDate = new Date();
            startDate.setHours(0,0,0,0);
            var endDate = new Date(startDate);
            var nbdays = 14;
            endDate.setDate(endDate.getDate() + nbdays);

            $scope.collaborators = collaboratorsResource.query({
                dtstart: startDate,
                dtend: endDate
            });

            var calendareventsResource = Rest.account.calendarevents.getResource();
            var nonworkingdaysQuery = calendareventsResource.query({
                type: 'nonworkingday',
                dtstart: startDate,
                dtend: endDate
            });


            $q.all([$scope.collaborators.$promise, nonworkingdaysQuery.$promise]).then(function(results) {

                var collaborators = results[0];
                var nonworkingdays = results[1];

                console.log(nonworkingdays);

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

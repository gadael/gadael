define([], function() {
        
    'use strict';
    
	return ['$scope', 'Rest', function($scope, Rest) {
		
        if ($scope.sessionUser.isManager) {
            // load waiting requests

            var waitingRequestResource = Rest.manager.waitingrequests.getResource();
            $scope.waitingrequests = waitingRequestResource.query();

        }


        if ($scope.sessionUser.department) {
            var collaboratorsResource = Rest.account.collaborators.getResource();

            var endDate = new Date();
            var nbdays = 14;
            endDate.setDate(endDate.getDate() + nbdays);

            $scope.collaborators = collaboratorsResource.query({
                dtstart: new Date(),
                dtend: endDate
            });




            $scope.collaborators.$promise.then(function(collaborators) {

                collaborators.forEach(function(collaborator) {

                    collaborator.days = {};
                    var loopDate = new Date();

                    loopDate.setHours(0,0,0,0);

                    for (var d=0; d<nbdays; d++) {

                        collaborator.days[loopDate.getTime()] = {
                            date: new Date(loopDate),
                            freebusy: false
                        };


                        loopDate.setDate(loopDate.getDate()+1);
                    }

                    var event, pos;

                    for(var f=0; f<collaborator.freebusy.length; f++) {
                        event = collaborator.freebusy[f];
                        pos = new Date(event.dtstart);
                        pos.setHours(0,0,0,0);

                        if (undefined === collaborator.days[pos.getTime()]) {
                            continue;
                        }

                        collaborator.days[pos.getTime()].freebusy = true;
                    }


                });
            });
        }

	}];
});

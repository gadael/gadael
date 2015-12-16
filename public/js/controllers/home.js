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
            endDate.setDate(endDate.getDate() + 7);

            $scope.collaborators = collaboratorsResource.query({
                dtstart: new Date(),
                dtend: endDate
            });
        }

	}];
});

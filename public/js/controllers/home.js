define([], function() {
        
    'use strict';
    
	return ['$scope', 'Rest', function($scope, Rest) {
		
        if ($scope.sessionUser.isManager) {
            // load waiting requests

            var waitingRequestResource = Rest.manager.waitingrequests.getResource();
            $scope.waitingrequests = waitingRequestResource.query();

        }
	}];
});

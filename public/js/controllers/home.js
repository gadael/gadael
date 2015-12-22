define([], function() {
        
    'use strict';
    
	return ['$scope', 'Rest', '$q', 'departmentDays', 'renewalChart',
            function($scope, Rest, $q, departmentDays, renewalChart) {

        var collaboratorsResource;
        var calendareventsResource = Rest.user.calendarevents.getResource();



        if ($scope.sessionUser.isAccount) {

            var beneficiariesResource = Rest.account.beneficiaries.getResource();
            collaboratorsResource = Rest.account.collaborators.getResource();


            renewalChart($scope, beneficiariesResource);
        }


		
        if ($scope.sessionUser.isManager) {
            // load waiting requests

            var waitingRequestResource = Rest.manager.waitingrequests.getResource();
            collaboratorsResource = Rest.manager.collaborators.getResource();

            $scope.waitingrequests = waitingRequestResource.query();
        }


        if ($scope.sessionUser.department) {
            departmentDays($scope, collaboratorsResource, calendareventsResource, 14);
        }

	}];
});

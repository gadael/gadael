define([], function() {
        
    'use strict';
    
	return ['$scope', 'Rest', '$q', 'departmentDays', 'renewalChart', 'gettext',
            function($scope, Rest, $q, departmentDays, renewalChart, gettext) {

        var collaboratorsResource;
        var calendareventsResource = Rest.user.calendarevents.getResource();

        $scope.setPageTitle(gettext('Home'));

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
            $scope.department = $scope.sessionUser.department;
            $scope.department.days = departmentDays(collaboratorsResource, calendareventsResource, 14, $scope.department._id);
        }

	}];
});

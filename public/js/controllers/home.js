define([], function() {
        
    'use strict';
    
	return ['$scope', 'Rest', '$q', 'departmentDays', 'renewalChart', 'gettext', '$http',
            function($scope, Rest, $q, departmentDays, renewalChart, gettext, $http) {

        var collaboratorsResource;
        var calendareventsResource = Rest.user.calendarevents.getResource();

        $scope.setPageTitle($scope.company.name+' - '+gettext('Home'));

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


        $scope.createFirstAdmin = false;
        if (!$scope.isAuthenticated) {
            $http.get('/rest/anonymous/createfirstadmin').then(function(response) {
                console.log(response);
                $scope.createFirstAdmin = response.data.allowed;
            });
        }

	}];
});

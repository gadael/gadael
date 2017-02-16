define([], function() {

    'use strict';

	return ['$scope', 'Rest', '$q', 'departmentReload', 'renewalChart', 'gettext', '$http', 'getCreateRequest',
            function($scope, Rest, $q, departmentReload, renewalChart, gettext, $http, getCreateRequest) {

        var collaboratorsResource;
        var calendareventsResource = Rest.user.calendarevents.getResource();

        $scope.setPageTitle($scope.company.name+' - '+gettext('Home'));



        if ($scope.sessionUser.isAccount) {

            $scope.createRequest = getCreateRequest($scope);

            var beneficiariesResource = Rest.account.beneficiaries.getResource();
            collaboratorsResource = Rest.account.collaborators.getResource();


            renewalChart($scope, beneficiariesResource);
        }



        if ($scope.sessionUser.isManager) {
            // load waiting requests

            var departmentsResource = Rest.manager.departments.getResource();
            var waitingRequestResource = Rest.manager.waitingrequests.getResource();
            collaboratorsResource = Rest.manager.collaborators.getResource();

            $scope.waitingrequests = waitingRequestResource.query();
            $scope.departments = departmentsResource.query();
        }

        var startDate = new Date();

        $scope.department = $scope.sessionUser.department;

        $scope.departmentReload = departmentReload(startDate, collaboratorsResource, calendareventsResource);
        $scope.departmentReload($scope.department, 0);


        $scope.createFirstAdmin = false;

        if ($scope.sessionUser && !$scope.sessionUser.isAuthenticated) {
            $http.get('/rest/anonymous/createfirstadmin').then(function(response) {
                $scope.createFirstAdmin = response.data.allowed;
            });
        }

	}];
});

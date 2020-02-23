define([], function() {

    'use strict';

	return [
        '$scope',
        'Rest',
        '$q',
        'departmentReload',
        'gettext',
        function(
            $scope,
            Rest,
            $q,
            departmentReload,
            gettext) {

        var collaboratorsResource;
        var calendareventsResource = Rest.user.calendarevents.getResource();

        $scope.setPageTitle(gettext('My department'));

        function execAfterSessionLoad() {

            if ($scope.sessionUser.isAccount) {
                collaboratorsResource = Rest.account.collaborators.getResource();
            }

            if ($scope.sessionUser.isManager) {
                collaboratorsResource = Rest.manager.collaborators.getResource();
            }

            var startDate = new Date();

            $scope.department = $scope.sessionUser.department;

            $scope.departmentReload = departmentReload(startDate, collaboratorsResource, calendareventsResource);
            $scope.departmentReload($scope.department, 0);
        }

        if (undefined !== $scope.sessionUser) {
            execAfterSessionLoad();
        } else {
            $scope.$watch('sessionUser', execAfterSessionLoad);
        }
	}];
});

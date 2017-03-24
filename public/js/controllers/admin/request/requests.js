define([], function() {

    'use strict';

	return [
        '$scope',
        '$location',
        'Rest',
        'getRequestStat',
        'gettext',
        'getCreateRequest',
        function($scope, $location, Rest, getRequestStat, gettext, getCreateRequest) {


        $scope.setPageTitle(gettext('Requests'));

        var users = Rest.admin.users.getResource();



        setTimeout(function() {
            // wait for search initialization
            $scope.search = $location.search();
            $scope.$apply();
        }, 1000);


        $scope.popover = {
            selectuser: {
                search: ''
            }
        };

        /**
         * A search in the users popover
         * @param {string} newValue
         * @param {string} oldValue
         */
        $scope.$watch('popover.selectuser.search', function(newValue) {
            if (newValue && newValue.length > 0) {
                $scope.popover.selectuser.users = users.query({ name: newValue, isAccount:true });
            } else {
                $scope.popover.selectuser.users = [];
            }
        });



        /**
         * Select a user account in the create request popover, open a modal
         * with spoof informations and available actions
         *
         * @param {Object} user
         */
        $scope.popoverSelect = getCreateRequest($scope);

        $scope.departments = Rest.admin.departments.getResource().query();


        $scope.getViewUrl = function(request) {
            if (request.absence.distribution.length > 0) {
                return '/admin/requests/absences/'+request._id;
            }

            if (request.workperiod_recover.length > 0) {
                return '/admin/requests/workperiod-recovers/'+request._id;
            }

            if (request.time_saving_deposit.length > 0) {
                return '/admin/requests/time-saving-deposits/'+request._id;
            }
        };


        $scope.getStat = getRequestStat;
	}];
});

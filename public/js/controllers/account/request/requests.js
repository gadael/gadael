define([], function() {

    'use strict';

	return [
        '$scope',
        'getCreateRequest',
        'getRequestStat',
        'gettext',
        function($scope, getCreateRequest, getRequestStat, gettext) {

        $scope.setPageTitle(gettext('Requests'));

        $scope.typeSelection = getCreateRequest($scope);

        $scope.getViewUrl = function(request) {
            if (request.absence.distribution.length > 0) {
                return '/account/requests/absences/'+request._id;
            }

            if (request.workperiod_recover.length > 0) {
                return '/account/requests/workperiod-recovers/'+request._id;
            }

            if (request.time_saving_deposit.length > 0) {
                return '/account/requests/time-saving-deposits/'+request._id;
            }
        };

        $scope.getStat = getRequestStat;
	}];
});

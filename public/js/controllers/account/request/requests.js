define([], function() {
    
    'use strict';
    
	return [
        '$scope', 
        '$location', 
        'Rest', 
        '$modal',
        'getRequestStat',
        'gettext',
        function($scope, $location, Rest, $modal, getRequestStat, gettext) {

        $scope.setPageTitle(gettext('Requests'));
 
        $scope.typeSelection = function() {
            var modalscope = $scope.$new();
            modalscope.goto = function(requestType) {
                $location.url('/account/requests/'+requestType+'-edit');
            };
            
            $modal({
                scope: modalscope,
                templateUrl: 'partials/account/request/request-create-modal.html',
                show: true
            });
            
        };

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

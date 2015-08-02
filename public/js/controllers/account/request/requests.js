define([], function() {
    
    'use strict';
    
	return [
        '$scope', 
        '$location', 
        'Rest', 
        '$modal',
        'getAbsenceStat',
        function($scope, $location, Rest, $modal, getAbsenceStat) {


 
        $scope.typeSelection = function() {
            var modalscope = $scope.$new();
            modalscope.goto = function(requestType) {
                $location.url('/account/requests/'+requestType+'-edit');
            };
            
            $modal({
                scope: modalscope,
                template: 'partials/account/request/request-create-modal.html',
                show: true
            });
            
        };

        $scope.getViewUrl = function(request) {
            if (request.absence.distribution) {
                return '/account/requests/absences/'+request._id;
            }
        };

        $scope.getStat = function(request) {
            return getAbsenceStat(request);
        };
	}];
});

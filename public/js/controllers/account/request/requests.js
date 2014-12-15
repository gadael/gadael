define([], function() {
    
    'use strict';
    
	return [
        '$scope', 
        '$location', 
        'Rest', 
        '$modal',
        function($scope, $location, Rest, $modal) {

 
        $scope.typeSelection = function() {
            var modalscope = $scope.$new();
            modalscope.goto = function(requestType) {
                $location.url('/account/requests/'+requestType+'-edit');
            };
            
            var myOtherModal = $modal({
                scope: modalscope,
                template: 'partials/account/request/request-create-modal.html',
                show: true
            });
            
        };
	}];
});

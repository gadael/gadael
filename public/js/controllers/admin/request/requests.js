define([], function() {
    
    'use strict';
    
	return [
        '$scope', 
        '$location', 
        'Rest', 
        '$modal',
        'getRequestStat',
        function($scope, $location, Rest, $modal, getRequestStat) {

        var users = Rest.admin.users.getResource();
        
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
        $scope.popoverSelect = function(user) {
            
            var modalscope = $scope.$new();
            modalscope.user = user;
            modalscope.goto = function(requestType) {
                $location.url('/admin/requests/'+requestType+'-edit?user='+user._id);
            };
            
            $modal({
                scope: modalscope,
                template: 'partials/admin/request/spoof-user-modal.html',
                show: true
            });
            
        };
            
        $scope.departments = Rest.admin.departments.getResource().query();


        $scope.getViewUrl = function(request) {
            if (request.absence.distribution.length > 0) {
                return '/admin/requests/absences/'+request._id;
            }

            if (request.workperiod_recover.length > 0) {
                return '/admin/requests/workperiod-recovers/'+request._id;
            }
        };


        $scope.getStat = getRequestStat;
	}];
});

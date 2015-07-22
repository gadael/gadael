define([], function() {
    
    'use strict';
    
	return [
        '$scope', 
        '$location', 
        'Rest', 
        '$modal',
        function($scope, $location, Rest, $modal) {

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
        $scope.$watch('popover.selectuser.search', function(newValue, oldValue) {
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
	}];
});

define([], function() {
    
    'use strict';
    
	return ['$scope', '$location', 'Rest', function($scope, $location, Rest) {

        var users = Rest.admin.users.getResource();
        
        $scope.popover = {
            selectuser: {
                search: ''   
            }
        };
        
        
        $scope.$watch('popover.selectuser.search', function(newValue, oldValue) {
            $scope.popover.selectuser.users = users.query({ name: newValue });
        });
        
        $scope.popoverSelect = function(user) {
            console.log(user);
            $location.path('/admin/request-edit');
        };
	}];
});

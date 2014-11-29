define([], function() {
    
    'use strict';

	return ['$scope', '$location', 'Rest', function($scope, $location, Rest) {

        $scope.request = Rest.admin.requests.getFromUrl().loadRouteId();
        
        
        if ($scope.request.$promise) {
            $scope.request.$promise.then(function(request) {
                // edit this request
            });
        } else {
            
            // create a new request
            
            var userId = $location.search().user;
            
            if (!userId) {
                throw new Error('the user parameter is mandatory to create a new request');   
            }
            
            var users = Rest.admin.users.getResource();

            users.get({id: userId}).$promise.then(function(user) {
                
                $scope.request.user = {
                    id: user._id,
                    name: user.lastname+' '+user.firstname
                };
            });
            
        }
        
        
        $scope.periodSelection = true;
		$scope.assignments = false;
        
        /**
         * Go back to requests list, admin view
         */
        $scope.back = function() {
            $location.path('/admin/requests');
        };
        
        /**
         * Go from the period selection to the right assignments step
         */
        $scope.next = function() {
            
            // hide the period selection
            $scope.periodSelection = false;
            
            // show the right assignement
            $scope.assignments = true;
        };

	}];
});


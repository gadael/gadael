define(['momentDurationFormat'], function(moment) {
    
    'use strict';

	return ['$scope', '$location', 'Rest', function($scope, $location, Rest) {

        // default values
        $scope.periodSelection = true;
		$scope.assignments = false;
        $scope.newRequest = false;
        $scope.editRequest = false;
        
        
        $scope.selection = {
            begin: undefined,
            end: undefined
        }
        
        
        /**
         * Get notified if interval is modified
         * @param {Date} begin 
         * @param {Date} end   
         */
        function onUpdateInterval(begin, end)
        {
            var d = (end && begin) ? (end.getTime() - begin.getTime()) : 0;
            var interval = moment.duration(d, "milliseconds");
            
            $scope.duration = interval.format("d [days], h [hours], m [minutes]");
            $scope.days = interval.format("d [days]", 2);
        }
        
        
        
        $scope.$watch(function() { return $scope.selection.begin; }, function(begin) {
            onUpdateInterval(begin, $scope.selection.end);
        });
        
        $scope.$watch(function() { return $scope.selection.end; }, function(end) {
            onUpdateInterval($scope.selection.begin, end);
        });
        

        
        
        $scope.request = Rest.admin.requests.getFromUrl().loadRouteId();
        
        
        if ($scope.request.$promise) {
            $scope.request.$promise.then(function(request) {
                // edit this request
                
                $scope.editRequest = true;
            });
        } else {
            
            // create a new request
            $scope.newRequest = true;
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


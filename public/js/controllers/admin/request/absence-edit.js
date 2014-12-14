define(['momentDurationFormat'], function(moment) {
    
    'use strict';

	return ['$scope', '$location', 'Rest', 'AbsenceEdit', function($scope, $location, Rest, AbsenceEdit) {

        
        
        AbsenceEdit.initScope($scope);
        

        
        function onceUserLoaded(user)
        {
            if (!user.roles.account) {
                throw new Error('the user must have a vacation account'); 
            }
            
            var account = user.roles.account;
            
            var calendarEvents = Rest.admin.calendarevents.getResource();
            var onUpdateInterval = AbsenceEdit.getOnUpdateInterval($scope, account, calendarEvents);
            
            $scope.$watch(function() { return $scope.selection.begin; }, function(begin) {
                onUpdateInterval(begin, $scope.selection.end);
            });

            $scope.$watch(function() { return $scope.selection.end; }, function(end) {
                onUpdateInterval($scope.selection.begin, end);
            });
        }
        

        
        
        $scope.request = Rest.admin.requests.getFromUrl().loadRouteId();
        
        
        if ($scope.request.$promise) {
            $scope.request.$promise.then(function(request) {
                // edit this request
                
                $scope.editRequest = true;
                onceUserLoaded(request.user.id);
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
                
                onceUserLoaded(user);
                
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
            
            var accountRights = Rest.admin.accountrights.getResource();
            $scope.accountRights = accountRights.query({ 
                user: $scope.request.user.id,
                dtstart: $scope.request.dtstart,
                dtend: $scope.request.dtend
            });
        };

	}];
});


define(['momentDurationFormat'], function(moment) {
    
    'use strict';

	return ['$scope', '$location', 'Rest', 'AbsenceEdit', function($scope, $location, Rest, AbsenceEdit) {

        
        
        AbsenceEdit.initScope($scope);
        
        // resources 
        var calendarEvents = Rest.account.calendarevents.getResource();
        var accountRights = Rest.account.accountrights.getResource();
        var user = Rest.user.user.getResource();
        

        $scope.request = Rest.admin.requests.getFromUrl().loadRouteId();

        
        if ($scope.request.$promise) {
            $scope.request.$promise.then(function(request) {
                // edit this request
                
                $scope.editRequest = true;
                
            });
        } else {
            
            // create a new request
            $scope.newRequest = true;
            
            user.get().$promise.then(function(user) {
                AbsenceEdit.onceUserLoaded($scope, user, calendarEvents);
            });
            
        }
        
        $scope.loadWorkingTimes = function(interval) {
            //TODO
        }

        $scope.loadEvents = function(interval) {
            //TODO
        }
        
        
        /**
         * Go back to requests list, admin view
         */
        $scope.back = function() {
            $location.path('/account/requests');
        };
        
        /**
         * Go from the period selection to the right assignments step
         */
        $scope.next = AbsenceEdit.getNextButtonJob($scope, accountRights);

	}];
});


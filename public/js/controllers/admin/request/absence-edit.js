define([], function() {
    
    'use strict';

	return ['$scope', '$location', 'Rest', 'AbsenceEdit', function($scope, $location, Rest, AbsenceEdit) {

        
        
        AbsenceEdit.initScope($scope);
        
        // resources 
        var calendarEvents = Rest.admin.calendarevents.getResource();
        var accountRights = Rest.admin.accountrights.getResource();
        var users = Rest.admin.users.getResource();
        var accountCollection = Rest.account.collection.getResource();

        $scope.request = Rest.admin.requests.getFromUrl().loadRouteId();
        
        
        if ($scope.request.$promise) {
            $scope.request.$promise.then(function(request) {
                // edit this request
                
                $scope.editRequest = true;
                AbsenceEdit.onceUserLoaded($scope, request.user.id, calendarEvents);
            });
        } else {
            
            // create a new request
            $scope.newRequest = true;
            var userId = $location.search().user;
            
            if (!userId) {
                throw new Error('the user parameter is mandatory to create a new request');   
            }

            users.get({id: userId}).$promise.then(function(user) {
                
                AbsenceEdit.onceUserLoaded($scope, user, calendarEvents);
                
                $scope.request.user = {
                    id: user._id,
                    name: user.lastname+' '+user.firstname
                };
            });
            
        }
        
        
        /**
         * Period picker callbacks
         */
        $scope.loadWorkingTimes = AbsenceEdit.getLoadWorkingTimes(user, calendarEvents);
        $scope.loadEvents = AbsenceEdit.getLoadEvents(calendars, calendarEvents);
        $scope.loadScholarHolidays = AbsenceEdit.getLoadScholarHolidays(calendars, calendarEvents);


        
        /**
         * Go back to requests list, admin view
         */
        $scope.back = function() {
            $location.path('/admin/requests');
        };
        
        /**
         * Go from the period selection to the right assignments step
         */
        $scope.next = AbsenceEdit.getNextButtonJob($scope, accountCollection, accountRights);

        $scope.saveAbsence = function() {
            console.log('save request');
        };
	}];
});


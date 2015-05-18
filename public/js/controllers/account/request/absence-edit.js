define([], function() {
    
    'use strict';


	return ['$scope', '$location', 'Rest', 'AbsenceEdit', function($scope, $location, Rest, AbsenceEdit) {


        
        AbsenceEdit.initScope($scope);
        
        // resources 
        var calendars = Rest.account.calendars.getResource();
        var calendarEvents = Rest.account.calendarevents.getResource();
        var accountCollection = Rest.account.collection.getResource();
        var accountRights = Rest.account.accountrights.getResource();
        var users = Rest.user.user.getResource();

        $scope.request = Rest.account.requests.getFromUrl().loadRouteId();

        
        if ($scope.request.$promise) {
            $scope.request.$promise.then(function() {
                // edit this request
                
                $scope.editRequest = true;
                
            });
        } else {
            
            // create a new request
            $scope.newRequest = true;
            
            users.get().$promise.then(function(user) {
                AbsenceEdit.onceUserLoaded($scope, user, calendarEvents);
            });
            
        }
        
        /**
         * Period picker callbacks
         */
        $scope.loadWorkingTimes = AbsenceEdit.getLoadWorkingTimes(users, calendarEvents);
        $scope.loadEvents = AbsenceEdit.getLoadEvents(calendars, calendarEvents);
        $scope.loadScholarHolidays = AbsenceEdit.getLoadScholarHolidays(calendars, calendarEvents);



        /**
         * Go back to requests list, admin view
         */
        $scope.back = function() {
            $location.path('/account/requests');
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


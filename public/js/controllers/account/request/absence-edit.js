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

        var userPromise =  users.get().$promise;
        
        if ($scope.request.$promise) {
            $scope.request.$promise.then(function() {
                // edit this request
                
                $scope.editRequest = true;
            });
        } else {
            
            // create a new request
            $scope.newRequest = true;

            $scope.request.timeCreated = new Date();
            $scope.request.absence = {
                    distribution: []
            };
        }
        

        userPromise.then(function(user) {
            AbsenceEdit.onceUserLoaded($scope, user, calendarEvents);

            $scope.request.user = {
                id: user._id,
                name: user.lastname+' '+user.firstname
            };
        });

        $scope.loadWorkingTimes = AbsenceEdit.getLoadWorkingTimes(userPromise, calendarEvents);
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
        $scope.next = function() {

            /**
             * Load collection
             * The collection available on the selected period
             */
            $scope.collection = accountCollection.get({
                user: $scope.user.id,
                dtstart: $scope.selection.begin,
                dtend: $scope.selection.end
            });

            var serviceAction = AbsenceEdit.getNextButtonJob($scope, accountRights);

            serviceAction();
        };




        $scope.saveAbsence = function() {

            var distributionElement;
            var rights = $scope.distribution.right;
            var periods = $scope.selection.periods;

            $scope.request.absence.distribution = AbsenceEdit.createDistribution(rights, periods, $scope.accountRights);

            $scope.request.ingaSave();
        };

	}];
});


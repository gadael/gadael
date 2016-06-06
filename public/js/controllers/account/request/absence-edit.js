define(['q'], function(Q) {
    
    'use strict';


	return ['$scope', '$location', 'Rest', 'AbsenceEdit', '$routeParams', '$rootScope',
            function($scope, $location, Rest, AbsenceEdit, $routeParams, $rootScope) {


        
        AbsenceEdit.initScope($scope);
        
        // resources 
        var calendars = Rest.account.calendars.getResource();
        var calendarEvents = Rest.user.calendarevents.getResource();
        var personalEvents = Rest.account.personalevents.getResource();
        var accountCollection = Rest.account.collection.getResource();
        var accountRights = Rest.account.accountrights.getResource();
        var users = Rest.user.user.getResource();

        $scope.request = Rest.account.requests.getFromUrl().loadRouteId();

        var userPromise =  users.get().$promise;
        var requestUser = null;

        $scope.selectionReady = false;
        
        if ($scope.request.$promise) {
            $scope.request.$promise.then(function() {
                // edit this request
                $scope.editRequest = true;
                AbsenceEdit.setSelectionFromRequest($scope);
                $scope.loadWorkingTimes = AbsenceEdit.getLoadWorkingTimes(calendarEvents, $scope.request.events);
                $scope.selectionReady = true;
            });
        } else {
            
            // create a new request
            $scope.newRequest = true;

            $scope.request.events = [];
            $scope.request.timeCreated = new Date();
            $scope.request.absence = {
                    distribution: []
            };

            $scope.loadWorkingTimes = AbsenceEdit.getLoadWorkingTimes(calendarEvents, $scope.request.events);
            $scope.selectionReady = true; // no selection
        }
        

        userPromise.then(function(user) {

            requestUser = user;
            AbsenceEdit.onceUserLoaded($scope, user, calendarEvents);
        });


        $scope.loadScholarHolidays = AbsenceEdit.getLoadScholarHolidays(calendars, calendarEvents);

        var loadEvents = AbsenceEdit.getLoadEvents(userPromise, personalEvents, calendars, calendarEvents);

        if (undefined === $routeParams.id) {
            $scope.loadEvents = loadEvents;

        } else {


            $scope.loadEvents = function(interval) {
                var deferred = Q.defer();
                loadEvents(interval).then(function(events) {

                    events = events.filter(function(e) {
                        return (e.request !== $routeParams.id);
                    });

                    deferred.resolve(events);
                });

                return deferred.promise;
            };
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
        $scope.next = function() {

            /**
             * Load collection
             * The collection available on the selected period
             */
            $scope.collection = accountCollection.get({
                user: $scope.sessionUser.id,
                dtstart: $scope.selection.begin,
                dtend: $scope.selection.end
            });

            var serviceAction = AbsenceEdit.getNextButtonJob($scope, requestUser, accountRights);

            serviceAction();
        };




        $scope.saveAbsence = function() {

            var renewals = $scope.distribution.renewal;
            var periods = $scope.selection.periods;


            // cleanup object
            delete $scope.request.requestLog;
            delete $scope.request.approvalSteps;

            if (undefined !== $scope.request.time_saving_deposit) {
                delete $scope.request.time_saving_deposit;
            }

            if (undefined !== $scope.request.workperiod_recover) {
                delete $scope.request.workperiod_recover;
            }

            try {
                $scope.request.absence.distribution = AbsenceEdit.createDistribution(renewals, periods, $scope.accountRights);
                $scope.request.gadaSave($scope.back);
            } catch(e) {
                $rootScope.pageAlerts.push({
                    message: e.message,
                    type: 'danger'
                });
            }
        };

	}];
});


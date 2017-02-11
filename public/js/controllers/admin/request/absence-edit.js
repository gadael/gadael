define(['q'], function(Q) {

    'use strict';

	return ['$scope', '$location', 'Rest', 'AbsenceEdit', '$routeParams',
    function($scope, $location, Rest, AbsenceEdit, $routeParams) {



        AbsenceEdit.initScope($scope);

        // resources
        var calendars = Rest.admin.calendars.getResource();
        var calendarEvents = Rest.admin.calendarevents.getResource();
        var personalEvents = Rest.admin.personalevents.getResource();
        var accountRights = Rest.admin.accountrights.getResource();
        var users = Rest.admin.users.getResource();
        var accountCollection = Rest.admin.collection.getResource();
        var consumption = Rest.admin.consumption.getResource();

        $scope.request = Rest.admin.requests.getFromUrl().loadRouteId();

        var userId, userPromise;


        /**
         * Load request and get user promise
         * @throws {Error} if the user parameter is missing on request creation
         * @returns {Promise} resolve to the user promise
         */
        function loadRequestAndUserPromise()
        {
            var deferred = Q.defer();

            if ($scope.request.$promise) {
                $scope.request.$promise.then(function(request) {
                    // edit this request

                    $scope.editRequest = true;
                    AbsenceEdit.setSelectionFromRequest($scope);
                    $scope.loadWorkingTimes = AbsenceEdit.getLoadWorkingTimes(calendarEvents, $scope.request.events, request.user.id);
                    $scope.selectionReady = true;

                    AbsenceEdit.onceUserLoaded($scope, request.user.id, calendarEvents);

                    $scope.user = request.user.id;
                    deferred.resolve(request.user.id);
                });

                return deferred.promise;


            } else {


                // create a new request
                $scope.newRequest = true;

                $scope.request.events = [];
                $scope.request.timeCreated = new Date();
                $scope.request.absence = {
                        distribution: []
                };

                $scope.selectionReady = true; // no selection

                userId = $location.search().user;

                if (!userId) {
                    throw new Error('the user parameter is mandatory to create a new request');
                }

                userPromise = users.get({ id: userId }).$promise;
                userPromise.then(function(user) {

                    $scope.user = user;

                    AbsenceEdit.onceUserLoaded($scope, user, calendarEvents, consumption);

                    $scope.request.user = {
                        id: user,
                        name: user.lastname+' '+user.firstname
                    };

                    $scope.loadWorkingTimes = AbsenceEdit.getLoadWorkingTimes(calendarEvents, $scope.request.events, user);
                });

                deferred.resolve(userPromise);
            }

            return deferred.promise;

        }


        /**
         * Period picker callbacks
         */

         $scope.loadScholarHolidays = AbsenceEdit.getLoadScholarHolidays(calendars, calendarEvents);

         var loadEvents = AbsenceEdit.getLoadEvents(loadRequestAndUserPromise(), personalEvents, calendars, calendarEvents);

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
            $location.path('/admin/requests');
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

            var serviceAction = AbsenceEdit.getNextButtonJob($scope, $scope.user, accountRights, consumption);

            serviceAction();
        };




        $scope.saveAbsence = function() {

            var renewals = $scope.distribution.renewal;
            var periods = $scope.selection.periods;

            AbsenceEdit.cleanDocument($scope.request);

            $scope.request.absence.distribution = AbsenceEdit.createDistribution(renewals, periods, $scope.accountRights, true);
            $scope.request.gadaSave($scope.back);

        };

	}];
});

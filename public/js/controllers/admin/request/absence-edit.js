define(['q'], function(Q) {
    
    'use strict';

	return ['$scope', '$location', 'Rest', 'AbsenceEdit', function($scope, $location, Rest, AbsenceEdit) {

        
        
        AbsenceEdit.initScope($scope);
        
        // resources 
        var calendars = Rest.admin.calendars.getResource();
        var calendarEvents = Rest.admin.calendarevents.getResource();
        var personalEvents = Rest.admin.personalevents.getResource();
        var accountRights = Rest.admin.accountrights.getResource();
        var users = Rest.admin.users.getResource();
        var collections = Rest.admin.collections.getResource();
        // TODO fix accountCollection, not the same as account/request

        $scope.request = Rest.admin.requests.getFromUrl().loadRouteId();
        
        var userId, userPromise;
        

        function loadRequestAndUserPromise()
        {
            var deferred = Q.defer();
            
            if ($scope.request.$promise) {
                $scope.request.$promise.then(function(request) {
                    // edit this request

                    $scope.editRequest = true;
                    AbsenceEdit.onceUserLoaded($scope, request.user.id, calendarEvents);

                    userId = request.user.id;
                    userPromise = users.get({ id: userId }).$promise;

                    deferred.resolve(userPromise);
                });

                return deferred.promise;
            }

            // create a new request
            $scope.newRequest = true;
            userId = $location.search().user;

            if (!userId) {
                throw new Error('the user parameter is mandatory to create a new request');   
            }

            userPromise = users.get({ id: userId }).$promise;
            userPromise.then(function(user) {

                $scope.user = user;

                AbsenceEdit.onceUserLoaded($scope, user, calendarEvents);

                $scope.request.user = {
                    id: user._id,
                    name: user.lastname+' '+user.firstname
                };
            });
            
            deferred.resolve(userPromise);

            return deferred.promise;

        }

        
        /**
         * Period picker callbacks
         */
        $scope.loadWorkingTimes = AbsenceEdit.getLoadWorkingTimes(loadRequestAndUserPromise(), calendarEvents);
        $scope.loadEvents = AbsenceEdit.getLoadEvents(userPromise, personalEvents, calendars, calendarEvents);
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
        $scope.next = function() {

            /**
             * Load collection
             * The collection available on the selected period
             */

            collections.get({
                user: $scope.user._id,
                dtstart: $scope.selection.begin,
                dtend: $scope.selection.end
            }).$promise.then(function(collectionList) {
                if (0 === collectionList.length) {
                    throw new Error('No active collection for this user');
                }

                if (1 !== collectionList.length) {
                    throw new Error('More than one collection found for the user');
                }

                $scope.collection = collectionList[0];
            });



            var serviceAction = AbsenceEdit.getNextButtonJob($scope, accountRights);

            serviceAction();
        };




        $scope.saveAbsence = function() {
            console.log('save request');
        };

	}];
});


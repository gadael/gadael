define(['momentDurationFormat', 'q'], function(moment, Q) {
    
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

            var deferred = Q.defer();

            user.get().$promise.then(function(user) {


                var account = user.roles.account;

                if (!account.currentScheduleCalendar) {
                    deferred.reject('No valid schedule calendar');
                    return;
                }

                calendarEvents.query({
                    calendar: account.currentScheduleCalendar._id,
                    dtstart: interval.from,
                    dtend: interval.to
                }).$promise.then(function(periods) {

                    var list = [];

                    for(var i=0; i<periods.length; i++) {
                        list.push({
                            dtstart: new Date(periods[i].dtstart),
                            dtend: new Date(periods[i].dtend)
                        });
                    }

                    deferred.resolve(list);
                });
            });

            return deferred.promise;

        };

        $scope.loadEvents = function(interval) {
            //TODO
        };
        
        
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


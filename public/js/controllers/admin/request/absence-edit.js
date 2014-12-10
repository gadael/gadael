define(['momentDurationFormat'], function(moment) {
    
    'use strict';

	return ['$scope', '$location', 'Rest', function($scope, $location, Rest) {

        // default values
        $scope.periodSelection = true;
		$scope.assignments = false;
        $scope.newRequest = false;
        $scope.editRequest = false;
        
        // list of beneficiaries objects, populated once period set
        $scope.accountRights = [];
        
        $scope.selection = {
            begin: undefined,
            end: undefined,
            isValid: false,
            duration: undefined,
            days: undefined,
            hours: undefined
        }
        
        var account;
        
        
        /**
         * Set a duration visible to the final user
         *
         * @param {Int} duration Number of miliseconds
         */
        function setDuration(duration)
        {
            var interval = moment.duration(duration, "milliseconds");
            
            $scope.selection.duration = interval.format("d [days], h [hours], m [minutes]");
            $scope.selection.days = interval.format("d [days]", 2);
            $scope.selection.hours = interval.format("h [hours]", 2);
            
            $scope.selection.isValid = duration > 0;
        }
        
        
        /**
         * Get notified if interval is modified
         * @param {Date} begin 
         * @param {Date} end   
         */
        function onUpdateInterval(begin, end)
        {
            if (!begin || !end) {
                return setDuration(0);
            }
            
            if (begin >= end) {
                return setDuration(0);
            }
            
            
            var calendarEvents = Rest.admin.calendarevents.getResource();
            calendarEvents.query({ 
                calendar: account.currentScheduleCalendar._id, 
                dtstart: begin, 
                dtend: end 
            }).$promise.then(function(periods) {
                var duration = 0;
                var p;
                
                for(var i=0; i<periods.length; i++) {
                    
                    p = {
                        dtstart: new Date(periods[i].dtstart),
                        dtend: new Date(periods[i].dtend)
                    };

                    duration += p.dtend.getTime() - p.dtstart.getTime();
                }
                
                return setDuration(duration);
            });

            
            
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
                
                account = user.roles.account;
                
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


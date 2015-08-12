define([], function() {
    'use strict';
    
	return ['$scope', 
		'$location', 
		'Rest', 
        '$q',
        'catchOutcome',
        'saveAccountScheduleCalendar',
        'addPeriodRow', function(
			$scope, 
			$location, 
			Rest, 
            $q,
            catchOutcome,
            saveAccountScheduleCalendar,
            addPeriodRow
		) {

		$scope.user = Rest.admin.users.getFromUrl().loadRouteId();

        if ($scope.user.$promise) {
            $scope.user.$promise.then(function() {
                
                // after user resource loaded, load account Collections
                
                if ($scope.user.roles && $scope.user.roles.account && $scope.user.roles.account._id) {
                    $scope.accountScheduleCalendars = accountschedulecalendars.query(
                        { account: $scope.user.roles.account._id }, function() {
                            if (0 === $scope.accountScheduleCalendars.length) {
                                $scope.addAccountScheduleCalendar();
                            } else {
                                
                                // force values as date object
                                
                                for(var i=0; i<$scope.accountScheduleCalendars.length; i++) {
                                    if ($scope.accountScheduleCalendars[i].from) {
                                        $scope.accountScheduleCalendars[i].from = new Date($scope.accountScheduleCalendars[i].from);
                                    }
                                    
                                    if ($scope.accountScheduleCalendars[i].to) {
                                        $scope.accountScheduleCalendars[i].to = new Date($scope.accountScheduleCalendars[i].to);
                                    }
                                }
                            }
                        }
                    );
                } else {
                    $scope.accountScheduleCalendars = [];
                    $scope.addAccountCollection();
                }
            });
        }
		
        $scope.calendars = Rest.admin.calendars.getResource().query({ type: 'workschedule' });


		
		$scope.cancel = function() {
			$location.path('/admin/users/'+$scope.user._id);
		};
                
                

		/**
         * Save button
         */
		$scope.saveAccountScheduleCalendars = function() {
            saveAccountScheduleCalendar($scope).then($scope.cancel);
	    };
                
                

        /**
         * The account schedule calendar ressource
         */
	    var accountschedulecalendars = Rest.admin.accountschedulecalendars.getResource();

        
        
        /**
         * Add a row to account collection list
         */
		$scope.addAccountScheduleCalendar = function() {   
            addPeriodRow($scope, $scope.accountScheduleCalendars, accountschedulecalendars);
		};
		
		
		
		
		$scope.removeIsDisabled = function(item) {
			if (undefined === item) {
				return false;
			}
			
			return (undefined !== item._id && item.from && item.from < Date.now());
		};
		
		
		/**
         * Delete
         */
		$scope.removeAccountScheduleCalendar = function(index) {
            var accountScheduleCalendar = $scope.accountScheduleCalendars[index];

            if (undefined === accountScheduleCalendar._id || null === accountScheduleCalendar._id) {
                $scope.accountScheduleCalendars.splice(index, 1);
                return;
            }
            
            var p = accountScheduleCalendar.$delete().then(function() {
                $scope.accountScheduleCalendars.splice(index, 1);
            });
            
            catchOutcome(p);
		};
        

	}];
});


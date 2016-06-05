define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        '$q',
        'catchOutcome',
        'saveAccountNWDaysCalendar',
        'addPeriodRow', function(
			$scope,
			$location,
			Rest,
            $q,
            catchOutcome,
            saveAccountNWDaysCalendar,
            addPeriodRow
		) {

		$scope.user = Rest.admin.users.getFromUrl().loadRouteId();

        if ($scope.user.$promise) {
            $scope.user.$promise.then(function() {

                // after user resource loaded, load account Collections

                if ($scope.user.roles && $scope.user.roles.account && $scope.user.roles.account._id) {
                    $scope.accountNWDaysCalendars = accountnwdayscalendars.query(
                        { account: $scope.user.roles.account._id }, function() {
                            if (0 === $scope.accountNWDaysCalendars.length) {
                                $scope.addAccountNWDaysCalendar();
                            } else {

                                // force values as date object

                                for(var i=0; i<$scope.accountNWDaysCalendars.length; i++) {
                                    if ($scope.accountNWDaysCalendars[i].from) {
                                        $scope.accountNWDaysCalendars[i].from = new Date($scope.accountNWDaysCalendars[i].from);
                                    }

                                    if ($scope.accountNWDaysCalendars[i].to) {
                                        $scope.accountNWDaysCalendars[i].to = new Date($scope.accountNWDaysCalendars[i].to);
                                    }
                                }
                            }
                        }
                    );
                } else {
                    $scope.accountNWDaysCalendars = [];
                    $scope.addAccountCollection();
                }
            });
        }

        $scope.calendars = Rest.admin.calendars.getResource().query({ type: 'nonworkingday' });



		$scope.cancel = function() {
			$location.path('/admin/users/'+$scope.user._id);
		};



		/**
         * Save button
         */
		$scope.saveAccountNWDaysCalendars = function() {
            saveAccountNWDaysCalendar($scope).then($scope.cancel);
	    };



        /**
         * The account schedule calendar ressource
         */
	    var accountnwdayscalendars = Rest.admin.accountnwdayscalendars.getResource();



        /**
         * Add a row to account collection list
         */
		$scope.addAccountNWDaysCalendar = function() {
            addPeriodRow($scope, $scope.accountNWDaysCalendars, accountnwdayscalendars);
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
		$scope.removeAccountNWDaysCalendar = function(index) {
            var accountNWDaysCalendar = $scope.accountNWDaysCalendars[index];

            if (undefined === accountNWDaysCalendar._id || null === accountNWDaysCalendar._id) {
                $scope.accountNWDaysCalendars.splice(index, 1);
                return;
            }

            var p = accountNWDaysCalendar.$delete().then(function() {
                $scope.accountNWDaysCalendars.splice(index, 1);
            });

            catchOutcome(p);
		};


	}];
});


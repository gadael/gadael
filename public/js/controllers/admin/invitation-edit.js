define([], function() {
    'use strict';

	return ['$scope', '$location', 'Rest', '$q', 'catchOutcome', 'gettext',
    function($scope, $location, Rest, $q, catchOutcome, gettext) {

        var Calendar = Rest.admin.calendars.getResource();
        var Department = Rest.admin.departments.getResource();
		var Invitation = Rest.admin.invitations.getResource();

        $scope.template = {
            emails: '',
            department: 0,
            departmentName: '',
            nonWorkingDaysCalendar: null
        };


        $scope.nonWorkingDaysCalendars = Calendar.query({ type: 'nonworkingday' });

        $scope.departments = Department.query();
        $scope.departments.$promise.then(function() {
            if ($scope.departments.length === 0) {
                // The select will not be displayed
                return;
            }

            $scope.departments.unshift({
                _id: 0,
                name: gettext('Create a new department')
            });
        });

        /**
         * get the department object or create it and the get the department object
         * @return {Promise} resolve to department ID or null
         */
        function getDepartment() {
            var deferred = $q.defer();
            if ($scope.template.department) {
                deferred.resolve($scope.template.department);
            }

            if (!$scope.template.departmentName) {
                deferred.resolve(null);
            } else {
                var department = new Department();
                department.name = $scope.template.departmentName;
                department.operator = 'AND';
                catchOutcome(department.$create())
                .then(function() {
                    deferred.resolve(department._id);
                });

            }

            return deferred.promise;
        }


        /**
         * Get invitations from emails list
         * @return {Array}
         */
        function saveInvitations(departmentId) {

            return $scope.template.emails.split('\n')
            .filter(function(email) {
                return (-1 !== email.indexOf('@'));
            })
            .map(function(email) {
                var invitation = new Invitation();
                invitation.department = departmentId;
                invitation.nonWorkingDaysCalendar = $scope.template.nonWorkingDaysCalendar;
                invitation.email = email;
                return catchOutcome(invitation.$create());
            });
        }


		$scope.back = function() {
			$location.path('/admin/invitations');
		};

		$scope.save = function() {
            getDepartment()
            .then(function(departmentId) {
                var promises = saveInvitations(departmentId);
                if (promises.length === 0) {
                    $scope.pageAlerts.push({
                        type: 'danger',
                        message: gettext('You must input one email address at least')
                    });

                    throw new Error('Nothing to submit');
                }

                return $q.all(promises);
            })
            .then($scope.back);
	    };
	}];
});

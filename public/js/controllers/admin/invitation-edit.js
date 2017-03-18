define([], function() {
    'use strict';

	return ['$scope', '$location', 'Rest', '$q', 'catchOutcome', function($scope, $location, Rest, $q, catchOutcome) {

        var Department = Rest.admin.departments.getResource();
		var Invitation = Rest.admin.invitations.getResource();

        $scope.emails = '';

        $scope.departments = Department.query();

        /**
         * get the department object or create it and the get the department object
         * @return {Promise} resolve to department ID or null
         */
        function getDepartment() {
            var deferred = $q.defer();
            if ($scope.department) {
                deferred.resolve($scope.department);
            }

            if (!$scope.departmentName) {
                deferred.resolve(null);
            } else {
                var department = new Department();
                department.name = $scope.departmentName;
                department.operator = 'AND';
                department.save()
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

            return $scope.emails.split('\n')
            .filter(function(email) {
                return (-1 !== email.indexOf('@'));
            })
            .map(function(email) {
                var invitation = new Invitation();
                invitation.department = departmentId;
                invitation.email = email;
                return catchOutcome(invitation.save());
            });
        }


		$scope.back = function() {
			$location.path('/admin/invitations');
		};

		$scope.save = function() {
            getDepartment()
            .then(function(departmentId) {
                return $q.all(saveInvitations(departmentId));
            })
            .then(function() {
                $scope.invitation.gadaSave($scope.back);
            });
	    };
	}];
});

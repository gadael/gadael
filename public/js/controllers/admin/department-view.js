define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        'departmentDays',
        'departmentReload',
        '$q',
         function(
			$scope,
			$location,
			Rest,
            departmentDays,
            departmentReload,
            $q
		) {

		$scope.department = Rest.admin.departments.getFromUrl().loadRouteId();


        /**
         * List of approval levels (deparmtent and managers)
         */
        $scope.approval = [];

        /**
         * Flattended array of departments
         */
        $scope.allDepartments = [];

        /**
         * Recursive loader
         * @return {Promise}
         */
        function getSubDepartments(department, startDate) {

            var promise = departmentDays(collaboratorsResource, calendareventsResource, 14, department._id, startDate, true);

            promise.then(function(days) {
                department.days = days;
                $scope.allDepartments.push(department);
            });

            var promises = [promise];
            for(var i=0; i<department.children.length; i++) {
                promises.push(getSubDepartments(department.children[i], startDate));
            }

            return $q.all(promises);

        }

        var startDate = new Date();
        var collaboratorsResource = Rest.admin.collaborators.getResource();
        var calendareventsResource = Rest.admin.calendarevents.getResource();


        $scope.departmentReload = departmentReload(startDate, collaboratorsResource, calendareventsResource);


        $scope.department.$promise.then(function(department) {

            if (department.managers.length > 0) {
                $scope.approval.push(department);
            }

            var ancestor;

            for (var i=0; i<$scope.department.ancestors.length; i++) {
                ancestor = $scope.department.ancestors[i];
                if (ancestor.managers.length > 0) {
                    $scope.approval.push(ancestor);
                }
            }

            return getSubDepartments($scope.department);
        })
        .then(function() {

            $scope.allDepartments.sort(function(d1, d2) {
                if ( d1.path < d2.path ) {
                    return -1;
                }
                if ( d1.path > d2.path ) {
                    return 1;
                }
                return 0;
            });
        });





		$scope.cancel = function() {
			$location.path('/admin/departments');
		};


	}];
});

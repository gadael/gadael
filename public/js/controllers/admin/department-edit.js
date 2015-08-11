define([], function() {
    
    'use strict';

	return ['$scope', '$location', 'Rest', function($scope, $location, Rest) {

		$scope.department = Rest.admin.departments.getFromUrl().loadRouteId();
        $scope.nonworkingdays = Rest.admin.calendars.getResource().query({ type: 'nonworkingday' });
        

        if (undefined === $scope.department.$promise) {
            // new item
            $scope.department.operator = 'OR';
        }


		/**
		 * Toggle selection of non-working day calendar
		 * @param {String} id calendar ID
		 */
		$scope.toggleSelection = function(id) {
            var idx = $scope.department.nonWorkingDays.indexOf(id);

            // is currently selected
            if (idx > -1) {
              $scope.department.nonWorkingDays.splice(idx, 1);
            }

            // is newly selected
            else {
              $scope.department.nonWorkingDays.push(id);
            }
        };

		$scope.back = function() {
			$location.path('/admin/departments');
		};
		
		$scope.saveDepartment = function() {
			$scope.department.ingaSave($scope.back);
	    };
	}];
});


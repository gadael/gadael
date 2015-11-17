define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        'getRequestStat', function(
			$scope,
			$location,
			Rest,
            getRequestStat
		) {


		$scope.request = Rest.admin.requests.getFromUrl().loadRouteId();

        $scope.stat = getRequestStat($scope.request);

        $scope.edit = function() {
            $location.path('/admin/requests/workperiod_recover-edit/'+$scope.request._id);
        };

        /**
         * Cancel the request
         */
		$scope.delete = function() {
            if (confirm('Are you sure you whant to delete the workperiod recover request?')) {
                $location.path('/admin/requests');
            }

		};

	}];
});


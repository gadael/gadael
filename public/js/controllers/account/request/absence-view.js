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


		$scope.request = Rest.account.requests.getFromUrl().loadRouteId();

        $scope.stat = getRequestStat($scope.request);

        $scope.backToList = function() {
            $location.path('/account/requests');
        };


        $scope.edit = function() {
            $location.path('/account/requests/absence-edit/'+$scope.request._id);
        };


		/**
         * Delete the absence request
         */
		$scope.delete = function() {
            if (confirm('Are you sure you whant to delete the absence request?')) {

                $scope.request.ingaDelete($scope.backToList);
            }

		};

	}];
});


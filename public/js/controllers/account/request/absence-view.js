define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        'getAbsenceStat', function(
			$scope,
			$location,
			Rest,
            getAbsenceStat
		) {


		$scope.request = Rest.account.requests.getFromUrl().loadRouteId();

        $scope.stat = getAbsenceStat($scope.request);

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

                $scope.request.$delete().then($scope.backToList);
            }

		};

	}];
});


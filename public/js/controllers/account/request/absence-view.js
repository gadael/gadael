define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        'AbsenceStat', function(
			$scope,
			$location,
			Rest,
            AbsenceStat
		) {


		$scope.request = Rest.account.requests.getFromUrl().loadRouteId();

        AbsenceStat($scope);

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


define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        'getRequestStat',
        'canEditRequest',
        function(
			$scope,
			$location,
			Rest,
            getRequestStat,
            canEditRequest
		) {


		$scope.request = Rest.account.requests.getFromUrl().loadRouteId();

        canEditRequest($scope);
        $scope.stat = getRequestStat($scope.request);

        $scope.backToList = function() {
            $location.path('/account/requests');
        };


        $scope.edit = function() {
            $location.path('/account/requests/time-saving-deposit-edit/'+$scope.request._id);
        };


		/**
         * Delete
         */
		$scope.delete = function() {
            if (confirm('Are you sure you want to delete the time saving deposit request?')) {

                $scope.request.gadaDelete($scope.backToList);
            }

		};

	}];
});

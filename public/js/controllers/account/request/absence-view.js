define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        'getRequestStat',
        'gettext',
            function(
			$scope,
			$location,
			Rest,
            getRequestStat,
            gettext
		) {


		$scope.request = Rest.account.requests.getFromUrl().loadRouteId();

        $scope.request.$promise.then(function() {
            var status = $scope.request.status.created;
            $scope.canEdit = ('accepted' === status || 'waiting' === status);
        });


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
            if (confirm(gettext('Are you sure you whant to delete the absence request?'))) {
                $scope.request.gadaDelete($scope.backToList);
            }

		};

	}];
});

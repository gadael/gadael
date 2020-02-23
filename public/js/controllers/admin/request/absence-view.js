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


		$scope.request = Rest.admin.requests.getFromUrl().loadRouteId();

        $scope.request.$promise.then(function() {
            var status = $scope.request.status;
            $scope.canEdit = ('accepted' === status.created || 'waiting' === status.created || 'waiting' === status.deleted);
        });


        $scope.stat = getRequestStat($scope.request);

        $scope.backToList = function() {
            $location.path('/admin/requests');
        };

        $scope.edit = function() {
            $location.path('/admin/requests/absence-edit/'+$scope.request._id);
        };

        /**
         * Cancel the absence request
         */
		$scope.delete = function() {
            if (confirm(gettext('Are you sure you want to delete the absence request?'))) {
                $scope.request.gadaDelete($scope.backToList);
            }

		};

	}];
});

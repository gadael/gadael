define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        'getRequestStat',
        'gettext',
        'gettextCatalog',
        function(
			$scope,
			$location,
			Rest,
            getRequestStat,
            gettext,
            gettextCatalog
		) {


		$scope.request = Rest.admin.requests.getFromUrl().loadRouteId();

        $scope.request.$promise.then(function() {
            var status = $scope.request.status.created;
            $scope.canEdit = ('accepted' === status || 'waiting' === status);
        });

        $scope.stat = getRequestStat($scope.request);

        $scope.edit = function() {
            $location.path('/admin/requests/time-saving-deposit-edit/'+$scope.request._id);
        };

        /**
         * Cancel the request
         */
		$scope.delete = function() {
            if (confirm(gettextCatalog.getString(gettext('Are you sure you want to delete the time saving deposit request?')))) {
                $location.path('/admin/requests');
            }

		};

	}];
});

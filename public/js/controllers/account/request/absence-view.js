define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        'getRequestStat',
        'canEditRequest',
        'gettext',
        'gettextCatalog',
            function(
			$scope,
			$location,
			Rest,
            getRequestStat,
            canEditRequest,
            gettext,
            gettextCatalog
		) {


		$scope.request = Rest.account.requests.getFromUrl().loadRouteId();

        canEditRequest($scope);
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
            if (confirm(gettextCatalog.getString(gettext('Are you sure you want to delete the absence request?')))) {
                $scope.request.gadaDelete($scope.backToList);
            }

		};

	}];
});

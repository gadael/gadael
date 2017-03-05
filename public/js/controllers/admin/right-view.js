define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        'getRightRuleType',
        function(
			$scope,
			$location,
			Rest,
            getRightRuleType
		) {


        var rightRenewalsResource = Rest.admin.rightrenewals.getResource();
        var collectionsResource = Rest.admin.collections.getResource();
        var usersResource = Rest.admin.users.getResource();

		$scope.right = Rest.admin.rights.getFromUrl().loadRouteId();

        $scope.right.$promise.then(function() {
            $scope.rightRenewals = rightRenewalsResource.query({ right: $scope.right._id });
            $scope.collections = collectionsResource.query({ right: $scope.right._id });
            $scope.users = usersResource.query({ right: $scope.right._id });
        });

        $scope.getRightRuleType = getRightRuleType;


		$scope.cancel = function() {
			$location.path('/admin/rights');
		};


        $scope.deleteRight = function() {
            $scope.right.gadaDelete($scope.cancel);
        };

	}];
});

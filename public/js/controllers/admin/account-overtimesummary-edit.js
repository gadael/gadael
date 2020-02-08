define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        function(
			$scope,
			$location,
			Rest
		) {
        var Overtimesummary = Rest.admin.overtimesummary.getResource();
        $scope.overtimesummary = new Overtimesummary();
		$scope.user = Rest.admin.users.getFromUrl().loadRouteId();

        $scope.mode = 'RIGHT';

        $scope.saveOvertimesummary = function() {
            $scope.overtimesummary.user = {
                id: $scope.user._id
            };
            if ('RIGHT' !== $scope.mode && $scope.overtimesummary.right) {
                delete $scope.overtimesummary.right;
            }
            $scope.overtimesummary.gadaSave($scope.cancel);
        };

		$scope.cancel = function() {
			$location.path('/admin/users/'+$scope.user._id);
		};
	}];
});

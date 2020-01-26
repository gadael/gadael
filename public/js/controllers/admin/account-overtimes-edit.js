define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest', function(
			$scope,
			$location,
			Rest
		) {

		$scope.user = Rest.admin.users.getFromUrl().loadRouteId();

		$scope.cancel = function() {
			$location.path('/admin/users/'+$scope.user._id);
		};

	}];
});

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


		$scope.cancel = function() {
			$location.path('/account/requests');
		};

	}];
});


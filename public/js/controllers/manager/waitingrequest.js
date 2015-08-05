define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        'getRequestStat', function(
			$scope,
			$location,
			Rest,
            getRequestStat
		) {


		$scope.request = Rest.manager.waitingrequests.getFromUrl().loadRouteId();

        $scope.stat = getRequestStat($scope.request);

        $scope.backToList = function() {
            $location.path('/manager/waitingrequests');
        };


        $scope.accept = function() {

        };

        $scope.reject = function() {

        };


	}];
});


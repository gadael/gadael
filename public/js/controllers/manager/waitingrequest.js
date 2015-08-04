define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest',
        'getAbsenceStat', function(
			$scope,
			$location,
			Rest,
            getAbsenceStat
		) {


		$scope.request = Rest.manager.waitingrequests.getFromUrl().loadRouteId();

        $scope.stat = getAbsenceStat($scope.request);

        $scope.backToList = function() {
            $location.path('/manager/waitingrequests');
        };


        $scope.accept = function() {

        };

        $scope.reject = function() {

        };


	}];
});


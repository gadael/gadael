define([], function() {
    'use strict';

	return ['$scope',
		'$location',
		'Rest' , function(
			$scope,
			$location,
			Rest
		) {


		$scope.request = Rest.account.requests.getFromUrl().loadRouteId();

        $scope.stat = {
            consumed: {
                D: 0,
                H: 0
            },
            duration: {
                D: 0,
                H: 0
            }
        };

        $scope.request.$promise.then(function() {
            var elem;
            for(var i=0; i<$scope.request.absence.distribution.length; i++) {
                elem = $scope.request.absence.distribution[i];

                $scope.stat.consumed[elem.right.quantity_unit] += elem.consumedQuantity;
                $scope.stat.duration[elem.right.quantity_unit] += elem.quantity;
            }
        });


		$scope.cancel = function() {
			$location.path('/account/requests');
		};

	}];
});


define([], function() {

    'use strict';

	return ['$scope', '$location', 'Rest', function($scope, $location, Rest) {

		$scope.recoverquantity = Rest.admin.recoverquantities.getFromUrl().loadRouteId();

        $scope.quantityUnits = [{
            value: 'D',
            label: 'Days'
        },
        {
            value: 'H',
            label: 'Hours'
        }];

        if (undefined === $scope.recoverquantity.$promise) {
            // new item
            $scope.recoverquantity.quantity_unit = 'D';
        }



		$scope.back = function() {
			$location.path('/admin/recoverquantities');
		};

		$scope.saveRecoverQuantity = function() {
			$scope.recoverquantity.ingaSave($scope.back);
	    };
	}];
});


define([], function() {

    'use strict';

	return ['$scope', '$location', 'Rest', 'gettextCatalog',
    function($scope, $location, Rest, gettextCatalog) {

		$scope.recoverquantity = Rest.admin.recoverquantities.getFromUrl().loadRouteId();

        $scope.quantityUnits = [{
            value: 'D',
            label: gettextCatalog.getString('Days')
        },
        {
            value: 'H',
            label: gettextCatalog.getString('Hours')
        }];

        if (undefined === $scope.recoverquantity.$promise) {
            // new item
            $scope.recoverquantity.quantity_unit = 'D';
        }



		$scope.back = function() {
			$location.path('/admin/recoverquantities');
		};

		$scope.saveRecoverQuantity = function() {
			$scope.recoverquantity.gadaSave($scope.back);
	    };
	}];
});

define([], function() {

    'use strict';

	return ['$scope', '$location' ,'$routeParams', 'Rest', '$modal', 'getOnlyIds', 'gettextCatalog',
            function($scope, $location, $routeParams, Rest, $modal, getOnlyIds, gettextCatalog) {

        // if there is createable special right
        // open a popup to define special only if right not saved

        if (!$routeParams.id) {
            var specialRightsResource = Rest.admin.specialrights.getResource();
            var specialRights = specialRightsResource.query({ country: $scope.company.country, create: true });

            specialRights.$promise.then(function() {
                if (specialRights.length > 0) {

                    var modalscope = $scope.$new();
                    modalscope.specialRights = specialRights;
                    modalscope.specialselection = '';

                    $modal({
                        scope: modalscope,
                        templateUrl: 'partials/admin/modal-specialrights.html',
                        show: true
                    });
                }
            });
        }


        $scope.nameReadOnly = false;
        $scope.descriptionReadOnly = false;
        $scope.editQuantity = true;

        $scope.setSpecialRight = function(specialright) {

            if ('' === specialright || undefined === specialright) {
                $scope.nameReadOnly = false;
                $scope.descriptionReadOnly = false;
                $scope.right.special = undefined;
                //$scope.right.name = '';
                return;
            }

            for (var defaultProp in specialright.default) {
                if (specialright.default[defaultProp]) {
                    $scope.right[defaultProp] = specialright.default[defaultProp];
                }
            }

            $scope.editQuantity = specialright.editQuantity;
            $scope.quantityLabel = specialright.quantityLabel;

            $scope.nameReadOnly = (null !== specialright.default.name);
            $scope.descriptionReadOnly = (null !== specialright.default.description);
        };


		$scope.right = Rest.admin.rights.getFromUrl().loadRouteId();
        $scope.types = Rest.admin.types.getResource().query();


        if ($scope.right.$promise) {
            // right modification
            $scope.right.$promise.then(function() {

                $scope.right.autoAdjustmentActive = (
                    $scope.right.autoAdjustment.quantity !== undefined &&
                    $scope.right.autoAdjustment.quantity !== null
                );


                // In modification we need only the ID but not in visualisation
                if (undefined !== $scope.right.autoAdjustment.types) {
                    $scope.right.autoAdjustment.types = getOnlyIds($scope.right.autoAdjustment.types);
                }

                $scope.right.infiniteQuantity = (null === $scope.right.quantity);

                $scope.setSpecialRight($scope.right.specialright);
            });
        } else {

            // right creation


            $scope.right.activeFor = {
                account:true,
                manager: true,
                admin: true
            };

            $scope.right.activeSpan = {
                useDefault: true
            };

            $scope.right.consumption = 'proportion';
        }


        $scope.quantityUnits = [{
            value: 'D',
            label: gettextCatalog.getString('Days')
        },
        {
            value: 'H',
            label: gettextCatalog.getString('Hours')
        }];

		$scope.back = function() {

            if ($scope.right._id) {
    			return $location.path('/admin/rights/'+$scope.right._id);
            }

            return $location.path('/admin/rights');
		};

		$scope.saveRight = function() {

            if ($scope.right.infiniteQuantity) {
                $scope.right.quantity = null;
            }

            delete $scope.right.infiniteQuantity;

            // remove autoadjustement if not active
            if (!$scope.right.autoAdjustmentActive) {
                $scope.right.autoAdjustment = {
                    quantity: null,
                    step: null,
                    types: []
                };
            }

			$scope.right.gadaSave($scope.back);
	    };

	}];
});

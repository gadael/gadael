define([], function() {

    'use strict';

	return ['$scope', '$location' ,'$routeParams', 'Rest', '$modal', 'getOnlyIds',
            function($scope, $location, $routeParams, Rest, $modal, getOnlyIds) {

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

            if ('' === specialright) {
                $scope.nameReadOnly = false;
                $scope.descriptionReadOnly = false;
                $scope.right.special = undefined;
                $scope.right.name = '';
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

                //if ($scope.right.special) {
                    // TODO: get special status for namereadonly
                    // console.log($scope.right.special);
                //}

                $scope.right.autoAdjustmentActive = (
                    $scope.right.autoAdjustment.quantity !== undefined &&
                    $scope.right.autoAdjustment.quantity !== null
                );


                // In modification we need only the ID but not in visualisation
                if (undefined !== $scope.right.autoAdjustment.types) {
                    $scope.right.autoAdjustment.types = getOnlyIds($scope.right.autoAdjustment.types);
                }
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

            $scope.right.consuption = 'proportion';
        }


        $scope.quantityUnits = [{
            value: 'D',
            label: 'Days'
        },
        {
            value: 'H',
            label: 'Hours'
        }];

		$scope.back = function() {
			$location.path('/admin/rights');
		};

		$scope.saveRight = function() {

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

define([], function() {
    
    'use strict';

	return ['$scope', '$location' ,'$routeParams', 'Rest', '$modal',
            function($scope, $location, $routeParams, Rest, $modal) {

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

            for (let defaultProp in specialright.default) {
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
                if ($scope.right.special) {
                    // TODO: get special status for namereadonly
                    $scope.nameReadOnly = true;
                }
            });
        } else {

            // right creation


            $scope.right = {
                activeFor: {
                    account:true,
                    manager: true,
                    admin: true
                },
                activeSpan: {
                    useDefault: true
                },
                consuption: 'proportion'
            };
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
			$scope.right.gadaSave($scope.back);
	    };
	}];
});


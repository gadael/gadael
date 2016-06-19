define([], function() {
    
    'use strict';

	return ['$scope', '$location' ,'$routeParams', 'Rest',
            function($scope, $location, $routeParams, Rest) {

        // if there is createable special right
        // open a popup to define special only if right not saved

        if (!$routeParams.id) {
            var specialRightsResource = Rest.admin.specialrights.getResource();
            var specialRights = specialRightsResource.query({ country: $scope.company.country, create: true });

            specialRights.$promise.then(function() {
                console.log(specialRights);
            });
        }

		$scope.right = Rest.admin.rights.getFromUrl().loadRouteId();
        $scope.types = Rest.admin.types.getResource().query();

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


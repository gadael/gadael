define([], function() {

    'use strict';

	return ['$scope', '$location', 'Rest', function($scope, $location, Rest) {

		$scope.compulsoryleave = Rest.admin.compulsoryleaves.getFromUrl().loadRouteId();

        var departmentsResource = Rest.admin.departments.getResource();
        var collectionsResource = Rest.admin.collections.getResource();

        $scope.departments = departmentsResource.query();
        $scope.collections = collectionsResource.query();

		$scope.back = function() {
            $location.path('/admin/compulsoryleaves');
		};

		$scope.save = function() {
			$scope.compulsoryleave.gadaSave($scope.back);
	    };
	}];
});


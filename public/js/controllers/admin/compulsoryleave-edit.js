define([], function() {

    'use strict';

	return ['$scope', '$location', 'Rest', function($scope, $location, Rest) {

		$scope.compulsoryleave = Rest.admin.compulsoryleaves.getFromUrl().loadRouteId();

        if (!$scope.compulsoryleave.$promise)
		{

			$scope.compulsoryleave.collections = [];
            $scope.compulsoryleave.departments = [];
			$scope.population = 'collections';
		}


        var departmentsResource = Rest.admin.departments.getResource();
        var collectionsResource = Rest.admin.collections.getResource();
        var rightsResource = Rest.admin.rights.getResource();


        $scope.departments = departmentsResource.query();
        $scope.collections = collectionsResource.query();
        $scope.rights = rightsResource.query();

        $scope.toggleSelection = function(cbList, id) {
            var idx = cbList.indexOf(id);
            if (idx > -1) {
                cbList.splice(idx, 1);
                return;
            }
            cbList.push(id);
        };

		$scope.back = function() {
            $location.path('/admin/compulsoryleaves');
		};

		$scope.save = function() {
			$scope.compulsoryleave.gadaSave($scope.back);
	    };
	}];
});


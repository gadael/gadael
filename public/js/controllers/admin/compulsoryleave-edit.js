define([], function() {

    'use strict';

	return ['$scope', '$location', 'Rest', function($scope, $location, Rest) {

		$scope.compulsoryleave = Rest.admin.compulsoryleaves.getFromUrl().loadRouteId();
        $scope.population = 'collections';

        if ($scope.compulsoryleave.$promise) {

            $scope.compulsoryleave.$promise.then(function() {

                if ($scope.compulsoryleave.departments.length > 0) {
                    $scope.population = 'departments';
                }

            });


        } else {

			$scope.compulsoryleave.collections = [];
            $scope.compulsoryleave.departments = [];

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

        $scope.isChecked = function(list, document) {

            if (undefined === list) {
                return false;
            }

            for (var i=0; i<list.length; i++) {
                if (list[i]._id === document._id) {
                    return true;
                }
            }
            return false;
        };

		$scope.back = function() {
            $location.path('/admin/compulsoryleaves');
		};

		$scope.save = function() {

            switch($scope.population) {
                case 'departments': $scope.compulsoryleave.collections = []; break;
                case 'collections': $scope.compulsoryleave.departments = []; break;
            }

			$scope.compulsoryleave.gadaSave($scope.back);
	    };
	}];
});


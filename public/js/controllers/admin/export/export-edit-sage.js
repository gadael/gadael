define([], function() {

    'use strict';

	return ['$scope', 'gettext', 'Rest', '$timeout', '$location',
            function($scope, gettext, Rest, $timeout, $location) {

		$scope.setPageTitle(gettext('Export in sage format'));

        var typeResources = Rest.admin.types.getResource();

        $scope.types = typeResources.query({});

        $scope.types.$promise.then(function() {
            // default value, check first type, types list is expected to be sorted manually
            // the annual leave type should appear on first place
            $scope.types[0].checked = true;
        });

        $scope.period = {};
        $scope.period.from = new Date();
        $scope.period.from.setDate(1);
        $scope.period.to = new Date($scope.period.from);
        $scope.period.from.setMonth($scope.period.from.getMonth()-1);
        $scope.period.to.setDate($scope.period.to.getDate()-1);



        $timeout(function() {
            $scope.downloadUrl = null;
        });


        /**
         * Redirect user to the download link
         */
        $scope.download = function() {

            var parameters = [];

            if (!$scope.period.from || !$scope.period.to) {
                return;
            }

            var typeSelected = false;
            for (var i=0; i< $scope.types.length; i++) {
                if ($scope.types[i].checked) {
                    parameters.push('rightType[]='+$scope.types[i]._id);
                    typeSelected = true;
                }
            }

            if (!typeSelected) {
                alert(gettext('At least one type must be selected'));
                return;
            }

            parameters.push('type=sage');
            parameters.push('from='+$scope.period.from.toJSON());
            parameters.push('to='+$scope.period.to.toJSON());


            $scope.downloadUrl = 'rest/admin/export?'+parameters.join('&');
            $timeout(function() {
                document.getElementById('downloadLink').click();
            });
        };


        $scope.cancel = function() {
            $location.path('/admin/exports');
        };
	}];
});

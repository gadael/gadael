define([], function() {

    'use strict';

	return ['$scope', 'gettext', 'Rest', '$timeout', '$location',
            function($scope, gettext, Rest, $timeout, $location) {

		$scope.setPageTitle(gettext('Export in sage format'));

        var typeResources = Rest.admin.types.getResource();

        $scope.types = typeResources.query({});

        $timeout(function() {
            $scope.period = {
                from: null,
                to: null
            };

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


            $scope.downloadUrl = '/rest/admin/export?'+parameters.join('&');
            $timeout(function() {
                document.getElementById('downloadLink').click();
            });
        };


        $scope.cancel = function() {
            $location.path('/admin/exports');
        };
	}];
});


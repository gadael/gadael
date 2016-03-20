define([], function() {

    'use strict';

	return ['$scope', 'gettext', 'Rest', '$timeout', '$location',
            function($scope, gettext, Rest, $timeout, $location) {

		$scope.setPageTitle(gettext('Export in sage format'));

        // default type

        $timeout(function() {
            $scope.period = {
                from: null,
                to: null
            };

            $scope.downloadUrl = null;
        });

        $scope.download = function() {

            var parameters = [];

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


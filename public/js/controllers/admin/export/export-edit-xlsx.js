define([], function() {

    'use strict';

	return ['$scope', 'gettext', 'Rest', '$timeout', '$location',
            function($scope, gettext, Rest, $timeout, $location) {

		$scope.setPageTitle(gettext('Export in XLSX file'));

        $scope.lunchMonths = [];
        var monthLoop = new Date();
        monthLoop.setDate(1);
        monthLoop.setHours(0, 0, 0, 0);

        for (var i=0; i<12; i++) {
            monthLoop.setMonth(monthLoop.getMonth() -1);
            $scope.lunchMonths.push(new Date(monthLoop));
        }

        // default type
        $timeout(function() {
            $scope.type = 'requests';
            $scope.period = {
                from: null,
                to: null,
                moment: new Date(),
                month: $scope.lunchMonths[0]
            };

            $scope.downloadUrl = null;
        });

        $scope.download = function() {
            var parameters = [];
            parameters.push('type='+$scope.type);

            if ('requests' === $scope.type) {
                parameters.push('from='+$scope.period.from.toJSON());
                parameters.push('to='+$scope.period.to.toJSON());
            }

            if ('balance' === $scope.type) {
                parameters.push('moment='+$scope.period.moment.toJSON());
            }

            if ('lunchs' === $scope.type) {
                parameters.push('month='+$scope.period.month.toJSON());
            }

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

define([], function() {

    'use strict';

	return ['$scope', 'gettext', 'Rest', function($scope, gettext, Rest) {

		$scope.setPageTitle(gettext('Export in XLSX file'));

        // default type

        $scope.type = 'requests';
        $scope.period = {
            from: null,
            to: null
        };



        $scope.download = function() {

            var parameters = {
                format: 'xlsx',
                type: $scope.type
            };

            if ('requests' === $scope.type) {
                parameters.from = $scope.period.from;
                parameters.to = $scope.period.to;
            }

            if ('balance' === $scope.type) {
                parameters.moment = $scope.moment;
            }

            var exportResource = Rest.admin.export.getResource();
            exportResource.get(parameters);
        };
	}];
});


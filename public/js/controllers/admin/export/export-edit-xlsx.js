define([], function() {

    'use strict';

	return ['$scope', 'gettext', 'Rest', function($scope, gettext, Rest) {

		$scope.setPageTitle(gettext('Export in XLSX file'));

        // default type

        $scope.type = 'requests';

        $scope.download = function() {

            var parameters = {
                format: 'xlsx',
                type: $scope.type
            };

            var exportResource = Rest.admin.export.getResource();
            exportResource.get(parameters);
        };
	}];
});


define([], function() {

    'use strict';

	return ['$scope', 'gettext', function($scope, gettext) {

		$scope.setPageTitle(gettext('Export in XLSX file'));

        // default type

        $scope.type = 'requests';
	}];
});


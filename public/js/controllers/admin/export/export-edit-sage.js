define([], function() {

    'use strict';

	return ['$scope', 'gettext', function($scope, gettext) {
		$scope.setPageTitle(gettext('Export a text file for Sage'));
	}];
});


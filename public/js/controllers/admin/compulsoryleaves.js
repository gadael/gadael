define([], function() {

    'use strict';

	return ['$scope', 'gettext', 'Rest', function($scope, gettext, Rest) {

        $scope.setPageTitle(gettext('Compulsory leaves'));

        var rightsResource = Rest.admin.rights.getResource();

        $scope.rights = rightsResource.query();
	}];
});

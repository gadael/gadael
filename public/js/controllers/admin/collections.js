define([], function() {
    
    'use strict';
    
	return ['$scope', 'gettext', 'Rest', function($scope, gettext, Rest) {

		
		$scope.setPageTitle(gettext('Right collections'));

        var rightResource = Rest.admin.rights.getResource();

        $scope.rights = rightResource.query({});

	}];
});


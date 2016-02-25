define([], function() {
        
    'use strict';
        
	return [
		'$scope', 
        'Rest',
        'gettext',
		function($scope, Rest, gettext) {

            $scope.setPageTitle(gettext('Requests'));
            
            $scope.search = {};

            $scope.collections = Rest.admin.collections.getResource().query();
            $scope.departments = Rest.admin.departments.getResource().query();
		}
	];
});

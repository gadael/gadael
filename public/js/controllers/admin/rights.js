define([], function() {
    'use strict';
    return [
		'$scope', 
		'Rest',
        'gettext',
		function($scope, Rest, gettext) {

            $scope.setPageTitle(gettext('Absence rights'));

			$scope.types = Rest.admin.types.getResource().query();
            $scope.collections = Rest.admin.collections.getResource().query();

		}
	];
});

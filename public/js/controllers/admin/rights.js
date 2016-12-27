define([], function() {
    'use strict';
    return [
		'$scope',
		'Rest',
        'gettext',
        '$location',
		function($scope, Rest, gettext, $location) {

            $scope.setPageTitle(gettext('Absence rights'));

			$scope.types = Rest.admin.types.getResource().query();
            $scope.collections = Rest.admin.collections.getResource().query();

            $scope.search = $location.search();
		}
	];
});

define([], function() {
    'use strict';
    return [
		'$scope',
		'Rest',
        'gettext',
		function($scope, Rest, gettext) {

            $scope.setPageTitle(gettext('Sort absence rights'));

            var rightResource = Rest.admin.rights.getResource();

            $scope.rights = rightResource.query({});

            $scope.dragControlListeners = {

            };
		}
	];
});

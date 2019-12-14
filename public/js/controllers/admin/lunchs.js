define([], function() {

    'use strict';

	return ['$scope', '$location', 'gettext', 'Rest',
    function($scope, $location, gettext, Rest) {

        $scope.setPageTitle(gettext('Lunch breaks by months'));
        $scope.user = Rest.admin.users.getFromUrl().loadRouteId();

        $scope.refresh = function() {
            
        };
	}];
});

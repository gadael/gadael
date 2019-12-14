define([], function() {

    'use strict';

	return ['$scope', '$location', 'gettext', 'Rest',
    function($scope, $location, gettext, Rest) {

        $scope.setPageTitle(gettext('Lunch breaks by months'));
        $scope.user = Rest.admin.users.getFromUrl().loadRouteId();

        $scope.getDate = function(aggregation) {
            var s = aggregation._id.split('-');
            return new Date(s[0], s[1]-1, 1, 0, 0, 0, 0);
        };
	}];
});

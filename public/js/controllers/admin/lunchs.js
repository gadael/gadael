define([], function() {

    'use strict';

	return ['$scope', '$location', '$route', '$http', 'gettext', 'Rest', 'catchOutcome',
    function($scope, $location, $route, $http, gettext, Rest, catchOutcome) {

        $scope.setPageTitle(gettext('Lunch breaks by months'));
        $scope.user = Rest.admin.users.getFromUrl().loadRouteId();

        $scope.refresh = function(d) {
            catchOutcome(
                $http.post('rest/admin/lunchs', {
                    'user.id': $scope.user._id,
                    year: d.getFullYear(),
                    month: d.getMonth()
    			})
            )
			.then($route.reload);
        };
	}];
});

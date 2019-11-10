define([], function() {
    'use strict';
    return [
		'$scope',
        'gettext',
        '$http',
        'catchOutcome',
        '$route',
		function($scope, gettext, $http, catchOutcome, $route) {

            $scope.setPageTitle(gettext('Invitations'));

            $scope.delete = function(invitation) {
                if (!confirm(gettext('Do you really want to delete this invitation?'))) {
                    return false;
                }

                catchOutcome($http.delete('rest/admin/invitations/'+invitation._id))
                .then($route.reload);
            };
		}
	];
});

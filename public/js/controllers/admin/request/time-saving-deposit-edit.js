define([], function() {

    'use strict';

	return ['$scope', '$location', 'Rest', 'TimeSavingDepositEdit', 'gettext',
            function($scope, $location, Rest, TimeSavingDepositEdit, gettext) {


        $scope.request = Rest.admin.requests.getFromUrl().loadRouteId();

        var beneficiariesResource = Rest.admin.beneficiaries.getResource();
        var timeSavingAccountsResource = Rest.admin.timesavingaccounts.getResource();
        var usersResource = Rest.admin.users.getResource();
        var collectionResource = Rest.admin.collection.getResource();

        function onceUserLoaded(user) {
            TimeSavingDepositEdit.setTimeSavingAccounts($scope, timeSavingAccountsResource, user);

            var dtstart = new Date();
            var dtend = new Date(dtstart);

            var collection = collectionResource.get({
                user: user.id,
                dtstart: dtstart,
                dtend: dtend
            });

            collection.$promise.then(function() {
                if (!collection._id) {
                    $scope.pageAlerts.push({
                        message: gettext('No active collection found'),
                        type: 'danger'
                    });
                    return;
                }
                TimeSavingDepositEdit.setRightBeneficiaries($scope, beneficiariesResource, collection);
            });

        }

        TimeSavingDepositEdit.initRequest($scope);

        var userId;

        if (!$scope.request.$promise) {
            // request creation

            userId = $location.search().user;

            if (!userId) {
                throw new Error('the user parameter is mandatory to create a new request');
            }

            var userPromise = usersResource.get({ id: userId }).$promise;
            userPromise.then(function(user) {
                onceUserLoaded(user);
            });
        } else {

            // request modification

            $scope.request.$promise.then(function() {
                onceUserLoaded($scope.request.user.id);
            });
        }


        /**
         * Go back to requests list, admin view
         */
        $scope.back = function() {
            $location.path('/admin/requests');
        };

        $scope.save = TimeSavingDepositEdit.getSaveRequest($scope);

	}];
});

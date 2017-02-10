define([], function() {

    'use strict';

	return ['$scope', '$location', 'Rest', 'TimeSavingDepositEdit',
            function($scope, $location, Rest, TimeSavingDepositEdit) {


        $scope.request = Rest.admin.requests.getFromUrl().loadRouteId();

        var beneficiariesResource = Rest.admin.accountbeneficiaries.getResource();
        var timeSavingAccountsResource = Rest.admin.timesavingaccounts.getResource();
        var usersResource = Rest.admin.users.getResource();

        function onceUserLoaded(user) {

            $scope.request.user = {
                id: user,
                name: user.lastname+' '+user.firstname
            };

            TimeSavingDepositEdit.setTimeSavingAccounts($scope, timeSavingAccountsResource, user);
            TimeSavingDepositEdit.setRightBeneficiaries($scope, beneficiariesResource, user);

            /**
             * Go back to the user visualisation page
             */
            $scope.back = function() {
                $location.path('/admin/users/'+user._id);
            };

            $scope.save = TimeSavingDepositEdit.getSaveRequest($scope, user);
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






	}];
});

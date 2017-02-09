define([], function() {

    'use strict';






	return ['$scope', '$location', 'Rest', 'TimeSavingDepositEdit',
            function($scope, $location, Rest, TimeSavingDepositEdit) {


        $scope.request = Rest.account.requests.getFromUrl().loadRouteId();

        var beneficiariesResource = Rest.account.beneficiaries.getResource();
        var timeSavingAccountsResource = Rest.account.timesavingaccounts.getResource();

        TimeSavingDepositEdit.setTimeSavingAccounts($scope, timeSavingAccountsResource);
        TimeSavingDepositEdit.setRightBeneficiaries($scope, beneficiariesResource);

        TimeSavingDepositEdit.initRequest($scope);




        /**
         * Go back to requests list, admin view
         */
        $scope.back = function() {
            $location.path('/account/requests');
        };

        $scope.save = TimeSavingDepositEdit.getSaveRequest($scope);

	}];
});

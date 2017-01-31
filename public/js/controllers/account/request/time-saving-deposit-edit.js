define([], function() {

    'use strict';


    function sortRenewals(renewal1, renewal2) {
        if (renewal1.finish > renewal2.finish) {
            return 1;
        }

        if (renewal2.finish > renewal1.finish) {
            return -1;
        }

        return 0;
    }



	return ['$scope', '$location', 'Rest', '$routeParams', '$rootScope', 'gettext', 'decimalAdjust',
            function($scope, $location, Rest, $routeParams, $rootScope, gettext, decimalAdjust) {


        $scope.request = Rest.account.requests.getFromUrl().loadRouteId();

        var beneficiariesResource = Rest.account.beneficiaries.getResource();
        var beneficiaries = beneficiariesResource.query();

        var timeSavingAccountsResource = Rest.account.timesavingaccounts.getResource();
        $scope.timeSavingAccounts = timeSavingAccountsResource.query();

        $scope.timeSavingAccounts.$promise.then(function(timeSavingAccounts) {
            // default to first available time saving account
            $scope.target = timeSavingAccounts[0];
        });

        // default request values
        $scope.request.time_saving_deposit = [{
            quantity: 1
        }];

        // prepare select
        $scope.rightBeneficiaries = [];
        beneficiaries.$promise.then(function(b) {
            b.forEach(function(beneficiary) {

                if ('timesavingaccount' === beneficiary.right.special) {
                    return;
                }

                beneficiary.renewals.sort(sortRenewals);

                beneficiary.renewals.forEach(function(renewal) {

                    var available = renewal.available_quantity;

                    if (available <= 0) {
                        return;
                    }

                    var label = gettext('{quantity} up to {date}')
                        .replace(/\{quantity\}/, decimalAdjust('round', available, -1)+' '+renewal.available_quantity_dispUnit)
                        .replace(/\{date\}/, renewal.finish.toLocaleDateString());

                    $scope.rightBeneficiaries.push({
                        value: {
                            right: beneficiary.right,
                            renewal: renewal
                        },
                        group: beneficiary.right.name,
                        label: label
                    });
                });
            });

            $scope.from = $scope.rightBeneficiaries[0].value;
        });





        if ($scope.request.$promise) {
            $scope.request.$promise.then(function() {
                // edit this request
                $scope.editRequest = true;

            });
        } else {

            // create a new request
            $scope.newRequest = true;

            $scope.request.events = [];

        }




        /**
         * Go back to requests list, admin view
         */
        $scope.back = function() {
            $location.path('/account/requests');
        };



        $scope.save = function() {

            // cleanup object
            delete $scope.request.requestLog;
            delete $scope.request.approvalSteps;

            $scope.request.time_saving_deposit[0].quantity_unit = $scope.from.right.quantity_unit;

            $scope.request.time_saving_deposit[0].from = {
                renewal: $scope.from.renewal
            };

            $scope.request.time_saving_deposit[0].to = {
                renewal: $scope.target.renewal
            };



            try {
                $scope.request.gadaSave($scope.back);
            } catch(e) {

                if (undefined === $rootScope.pageAlerts) {
                    $rootScope.pageAlerts = [];
                }

                $rootScope.pageAlerts.push({
                    message: e.message,
                    type: 'danger'
                });
            }


        };

	}];
});

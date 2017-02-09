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







    return function(gettextCatalog, decimalAdjust) {

        // Service to edit a time saving deposit request,
        // shared by account/request/time-saving-deposit-edit and admin/request/time-saving-deposit-edit


        function setTimeSavingAccounts($scope, timeSavingAccountsResource) {
            $scope.timeSavingAccounts = timeSavingAccountsResource.query();

            $scope.timeSavingAccounts.$promise.then(function(timeSavingAccounts) {

                if (0 === timeSavingAccounts.length) {
                    $scope.pageAlerts.push({
                        message: gettextCatalog.getString('No available time saving account'),
                        type: 'danger'
                    });
                    return;
                }

                // default to first available time saving account
                $scope.target = timeSavingAccounts[0];
            });

            // default request values
            $scope.request.time_saving_deposit = [{
                quantity: 1
            }];

        }


        function setRightBeneficiaries($scope, beneficiariesResource) {

            var beneficiaries = beneficiariesResource.query();

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

                        var label = gettextCatalog.getString('{quantity} up to {date}')
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

        }


        function initRequest($scope) {
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

        }

        /**
         * @return {Function}
         */
        function getSaveRequest($scope) {

            return function() {

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

                $scope.request.gadaSave($scope.back);

            };
        }



        return {
            setRightBeneficiaries: setRightBeneficiaries,
            setTimeSavingAccounts: setTimeSavingAccounts,
            initRequest: initRequest,
            getSaveRequest: getSaveRequest
        };
    };

});

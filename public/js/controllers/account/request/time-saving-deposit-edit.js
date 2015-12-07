define([], function() {

    'use strict';


	return ['$scope', '$location', 'Rest', '$routeParams', '$rootScope',
            function($scope, $location, Rest, $routeParams, $rootScope) {


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
        $scope.request = {
            time_saving_deposit: [{
                quantity: 1
            }]
        };

        // prepare select
        $scope.rightBeneficiaries = [];
        beneficiaries.$promise.then(function(b) {
            b.forEach(function(beneficiary) {

                if (undefined !== beneficiary.right.timeSaving && beneficiary.right.timeSaving.active) {
                    return;
                }

                beneficiary.renewals.forEach(function(renewal) {

                    var available = renewal.available_quantity;

                    if (available <= 0) {
                        return;
                    }

                    $scope.rightBeneficiaries.push({
                        value: {
                            right: beneficiary.right,
                            renewal: renewal
                        },
                        group: beneficiary.right.name,
                        label: available+' '+renewal.available_quantity_dispUnit+' up to '+renewal.finish.toLocaleDateString()
                    });

                });
            });
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
                renewal: $scope.targetBeneficiary.renewal
            };

            console.log($scope.request);


            try {
                $scope.request.ingaSave($scope.back);
            } catch(e) {
                $rootScope.pageAlerts.push({
                    message: e.message,
                    type: 'danger'
                });
            }


        };

	}];
});


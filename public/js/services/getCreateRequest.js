define(function() {

    'use strict';

    return function($location, $modal, Rest) {


        /**
         * check if a time saving account is available
         * @param {Object} user
         */
        function getTimeSavingAccounts(user) {
            if (undefined === user) {
                return Rest.account.timesavingaccounts.getResource().query();
            }

            return Rest.admin.timesavingaccounts.getResource().query({ account: user.roles.account._id });
        }



        /**
         * @param {Object} $scope
         * @return {Function}
         */
        return function getCreateRequest(parentScope) {

            /**
             * @param {Object} user Optional parameter
             */
            return function(user) {

                var templateUrl =
                (undefined === user) ?
                'partials/account/request/request-create-modal.html' :
                'partials/admin/request/spoof-user-modal.html';

                var $scope = parentScope.$new();

                $scope.timeSavingAccounts = getTimeSavingAccounts(user);
                $scope.user = user;
                $scope.goto = function(requestType) {
                    if (undefined === user) {
                        $location.url('/account/requests/'+requestType+'-edit');
                        return;
                    }
                    $location.url('/admin/requests/'+requestType+'-edit?user='+user._id);
                };

                $modal({
                    scope: $scope,
                    templateUrl: templateUrl,
                    show: true
                });


            };
        };

    };
});

define(['services/request-edit'], function(loadRequestEdit) {

    'use strict';

    return function(gettextCatalog) {

        var RequestEdit = loadRequestEdit(gettextCatalog);

        // Service to edit a overtime declaration,
        // shared by account/request/worperiod-recover-edit and admin/request/worperiod-recover-edit


        /**
         * @param {Resource} unavailableEvents
         * @param {Object} [user] for admin only
         */
        function getLoadNonWorkingTimes(unavailableEvents, user) {

            return function(interval) {

                var queryParams = {
                    dtstart: interval.from,
                    dtend: interval.to
                };

                if (undefined !== user) {
                    queryParams.user = user._id;
                }

                return unavailableEvents.query(queryParams).$promise;
            };
        }



        function getSave($scope) {

            /**
             * Action for save button
             */
            return function() {
                // cleanup object
                delete $scope.request.requestLog;
                delete $scope.request.approvalSteps;

                var q;

                var quantity_unit = 'H';
                if ($scope.request.workperiod_recover[0].recoverQuantity) {
                    quantity_unit = $scope.request.workperiod_recover[0].recoverQuantity.quantity_unit;
                }

                if ('H' === quantity_unit) {
                    q = $scope.selection.hours.split(' ')[0];
                } else {
                    q = $scope.selection.days.split(' ')[0];
                }

                q = q.replace(',', '.');
                $scope.request.workperiod_recover[0].quantity = q;
                $scope.request.events = $scope.selection.periods;
                $scope.request.gadaSave($scope.back);
            };
        }



        function initNewRequest($scope) {
            $scope.request.events = [];
            $scope.request.timeCreated = new Date();
            $scope.request.workperiod_recover = [];
        }



        return {

            initScope: RequestEdit.initScope,

            setSelectionFromRequest: RequestEdit.setSelectionFromRequest,

            getLoadPersonalEvents: RequestEdit.getLoadPersonalEvents,
            getLoadNonWorkingDaysEvents: RequestEdit.getLoadNonWorkingDaysEvents,
            getLoadEvents: RequestEdit.getLoadEvents,
            getLoadScholarHolidays: RequestEdit.getLoadScholarHolidays,
            onceUserLoaded: RequestEdit.onceUserLoaded,

            getLoadNonWorkingTimes: getLoadNonWorkingTimes,
            getSave: getSave,
            initNewRequest: initNewRequest
        };
    };
});

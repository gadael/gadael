define(['momentDurationFormat', 'q'], function(moment, Q) {

    'use strict';

    // Service to edit a workperiod recover request,
    // shared by account/request/worperiod-recover-edit and admin/request/worperiod-recover-edit

    return {

        getLoadNonWorkingTimes: function(unavailableEvents) {
            return function(interval) {

                var queryParams = {
                    dtstart: interval.from,
                    dtend: interval.to
                };


                return unavailableEvents.query(queryParams).$promise;
            };
        }
    };

});

define(['services/request-edit'], function(loadRequestEdit) {

    'use strict';

    return function(gettextCatalog) {

        var RequestEdit = loadRequestEdit(gettextCatalog);

        // Service to edit a workperiod recover request,
        // shared by account/request/worperiod-recover-edit and admin/request/worperiod-recover-edit

        return {

            initScope: RequestEdit.initScope,

            setSelectionFromRequest: RequestEdit.setSelectionFromRequest,

            getLoadPersonalEvents: RequestEdit.getLoadPersonalEvents,
            getLoadNonWorkingDaysEvents: RequestEdit.getLoadNonWorkingDaysEvents,
            getLoadEvents: RequestEdit.getLoadEvents,
            getLoadScholarHolidays: RequestEdit.getLoadScholarHolidays,


            getLoadNonWorkingTimes: function(unavailableEvents) {

                return function(interval) {

                    var queryParams = {
                        dtstart: interval.from,
                        dtend: interval.to
                    };

                    return unavailableEvents.query(queryParams).$promise;
                };
            },


            onceUserLoaded: RequestEdit.onceUserLoaded
        };
    };
});

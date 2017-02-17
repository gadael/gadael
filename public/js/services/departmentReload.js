define(function() {

    'use strict';


    return function createDepartmentReload(departmentDays) {

        /**
         * Service
         * @return {Function}
         */
        return function(startDate, collaboratorsResource, calendareventsResource) {

            return function departmentReload(department, relativeDays) {

                if (undefined === department || null === department) {
                    return;
                }

                department.loading = true;

                if (0 !== relativeDays) {
                    startDate.setDate(startDate.getDate()+relativeDays);
                }

                departmentDays(collaboratorsResource, calendareventsResource, 14, department._id, startDate)
                .then(function(days) {
                    department.loading = false;
                    department.days = days;
                });

            };
        };
    };
});

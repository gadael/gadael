define(function() {

    'use strict';



    /**
     * Prepare scope variables for departments visualization
     */
    return function createDepartmentDays($q, $location) {

        /**
         * @return {Object} scope variable
         */
        return function departmentDays(collaboratorsResource, calendareventsResource, nbdays, department, adminLink) {

            var scopeOutput = {};

            var startDate = new Date();
            startDate.setHours(0,0,0,0);
            var endDate = new Date(startDate);

            endDate.setDate(endDate.getDate() + nbdays);

            var collaboratorsParams = {
                dtstart: startDate,
                dtend: endDate
            };

            if (department !== undefined) {
                // department parameter is mandatory for managers
                // because manangers can display collaborators for their departments and the managed departments
                collaboratorsParams.department = department;
            }

            if (adminLink === undefined) {
                adminLink = false;
            }

            scopeOutput.adminLink = adminLink;
            scopeOutput.collaborators = collaboratorsResource.query(collaboratorsParams);

            scopeOutput.viewCollaborator = function(collaborator) {
                if (!scopeOutput.adminLink) {
                    return;
                }

                $location.path('/admin/users/'+collaborator._id);
            };

            var nonworkingdaysQuery = calendareventsResource.query({
                type: 'nonworkingday',
                dtstart: startDate,
                dtend: endDate
            });


            $q.all([scopeOutput.collaborators.$promise, nonworkingdaysQuery.$promise]).then(function(results) {

                var collaborators = results[0];
                var nonworkingdays = results[1];

                for(var c=0; c<collaborators.length; c++) {

                    var collaborator = collaborators[c];

                    collaborator.days = {};
                    var loopDate = new Date();

                    loopDate.setHours(0,0,0,0);

                    for (var d=0; d<nbdays; d++) {

                        collaborator.days[loopDate.getTime()] = {
                            date: new Date(loopDate),
                            free: false,
                            events: [],
                            nonworkingday: null
                        };


                        loopDate.setDate(loopDate.getDate()+1);
                    }

                    var event, pos;



                    for (var f=0; f<collaborator.free.length; f++) {
                        event = collaborator.free[f];
                        pos = new Date(event.dtstart);
                        pos.setHours(0,0,0,0);

                        if (undefined === collaborator.days[pos.getTime()]) {
                            continue;
                        }

                        collaborator.days[pos.getTime()].free = true;
                    }

                    for (var e=0; e<collaborator.events.length; e++) {
                        event = collaborator.events[e];
                        pos = new Date(event.dtstart);
                        pos.setHours(0,0,0,0);

                        if (undefined === collaborator.days[pos.getTime()]) {
                            continue;
                        }

                        collaborator.days[pos.getTime()].events.push(event);
                    }


                    for (var n=0; n<nonworkingdays.length; n++) {
                        event = nonworkingdays[n];
                        pos = new Date(event.dtstart);
                        pos.setHours(0,0,0,0);

                        if (undefined === collaborator.days[pos.getTime()]) {
                            continue;
                        }

                        collaborator.days[pos.getTime()].free = false;
                        collaborator.days[pos.getTime()].nonworkingday = event;
                    }
                }

            });

            return scopeOutput;
        };
    };
});

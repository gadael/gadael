define(function() {

    'use strict';


    function createCollaboratorDays(collaborator, startDate, nbdays) {
        collaborator.days = {};
        var loopDate = new Date(startDate);

        loopDate.setHours(0,0,0,0);

        for (var d=0; d<nbdays; d++) {

            collaborator.days[loopDate.getTime()] = {
                date: new Date(loopDate),
                free: false,
                events: [],
                nonworkingday: null,
                className: 'cal-notscheduled' // possibles values are:
                                              // cal-notscheduled
                                              // cal-available
                                              // cal-event
                                              // cal-nonworking
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
            collaborator.days[pos.getTime()].className = 'cal-available';
        }

        for (var e=0; e<collaborator.events.length; e++) {
            event = collaborator.events[e];
            pos = new Date(event.dtstart);
            pos.setHours(0,0,0,0);

            if (undefined === collaborator.days[pos.getTime()]) {
                continue;
            }

            collaborator.days[pos.getTime()].events.push(event);
            collaborator.days[pos.getTime()].className = 'cal-event';
        }
    }



    /**
     * Prepare scope variables for departments visualization
     */
    return function createDepartmentDays($q, $location) {

        /**
         * @return {Promise}  resolve to scope variable
         */
        return function departmentDays(collaboratorsResource, calendareventsResource, nbdays, department, startDate, adminLink) {

            var scopeOutput = {};

            if (undefined === startDate) {
                startDate = new Date();
            }

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

            if (undefined !== collaboratorsResource) {
                scopeOutput.collaborators = collaboratorsResource.query(collaboratorsParams);
            } else {
                throw new Error('Missing collaborators resource');
            }

            scopeOutput.viewCollaborator = function(collaborator) {
                if (!scopeOutput.adminLink) {
                    return;
                }

                $location.path('/admin/users/'+collaborator._id);
            };




            return scopeOutput.collaborators.$promise
            .then(function(collaborators) {

                var nwdPromises = [];

                for(var c=0; c<collaborators.length; c++) {

                    var collaborator = collaborators[c];

                    createCollaboratorDays(collaborator, startDate, nbdays);


                    var nonworkingdaysQuery = calendareventsResource.query({
                        type: 'nonworkingday',
                        dtstart: startDate,
                        dtend: endDate,
                        user: collaborator._id
                    });

                    nwdPromises.push(nonworkingdaysQuery.$promise);
                }

                return $q.all(nwdPromises)
                .then(function(nwdResults) {

                    var event, pos;

                    for(var c=0; c<collaborators.length; c++) {

                        var collaborator = collaborators[c];
                        var nonworkingdays = nwdResults[c];

                        for (var n=0; n<nonworkingdays.length; n++) {
                            event = nonworkingdays[n];
                            pos = new Date(event.dtstart);
                            pos.setHours(0,0,0,0);

                            if (undefined === collaborator.days[pos.getTime()]) {
                                continue;
                            }

                            collaborator.days[pos.getTime()].free = false;
                            collaborator.days[pos.getTime()].nonworkingday = event;
                            collaborator.days[pos.getTime()].className = 'cal-nonworking';
                        }

                    }

                    return collaborators;

                });
            })

            .then(function() {
                return scopeOutput;
            });


        };
    };
});

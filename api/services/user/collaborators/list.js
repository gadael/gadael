'use strict';


/**
 * The collaborators list service
 * list of collaborators in same department with an account role
 * a property on each collaborator contain the list of events between the two dates given in parameter
 */

var Q = require('q');










/**
 * Create the service
 * @param   {Object} services
 * @param   {Object} app
 * @returns {listItemsService}
 */
exports = module.exports = function(services, app) {

    var service = new services.list(app);

    var collaborators = {};

    /**
     * @return {Promise}
     */
    function getUser(userId) {

        var find = service.app.db.models.User.findOne({ _id: userId });
        find.populate('department');

        return find.exec();
    }





    function getDepartmentUsers(departmentId) {

        var deferred = Q.defer();
        var find = service.app.db.models.Department.findOne({ _id: departmentId });

        find.exec(function(err, d) {
            if (err) {
                return deferred.reject(err);
            }

            deferred.resolve(d.getUsers());
        });

        return deferred.promise;
    }




    /**
     * @return {Promise}
     */
    function getUsers(user) {

        if (null === user) {
            throw new Error('user not found');
        }

        return user.department.getUsers();
    }






    /**
     * @return {Promise}
     */
    function filterAccounts(users) {

        return Q(users.filter(function(user) {
            if (undefined === user.roles.account) {
                return false;
            }

            if (null === user.roles.account) {
                return false;
            }

            return true;
        }));
    }


    function populateCollaborators(userAccounts) {

        var jurassic = require('jurassic');

        userAccounts.forEach(function(user) {
            if (undefined === collaborators[user.id]) {
                collaborators[user.id] = user.toObject();

                collaborators[user.id].workscheduleEra = null;
                collaborators[user.id].workingtimes = [];

                collaborators[user.id].eventsEra = new jurassic.Era();
                collaborators[user.id].events = [];

                collaborators[user.id].free = [];
            }
        });

        return Q(userAccounts);
    }



    /**
     * @return {Array}
     */
    function addUid(events) {

        function fixEvent(event) {

            if (undefined === event.uid || null === event.uid || '' === event.uid) {
                event.uid = event._id;
            }

            // do not give personal informations to collaborators
            // TODO: this could be a parameter
            event.summary = '';
            event.description = '';
            event.location = '';
            return event;
        }

        return events.map(fixEvent);
    }




    /**
     * @return {Promise}
     */
    function groupByCollaborator(events) {


        events.forEach(function(event) {

            var collaborator = event.user.id;

            if (undefined === collaborators[collaborator._id]) {
                throw new Error('Missing collaborator');
            }

            collaborators[collaborator._id].eventsEra.addPeriod(event);
            collaborators[collaborator._id].events.push(event);
        });

        var result = [];
        for(var id in collaborators) {
            if ( collaborators.hasOwnProperty(id)) {
                result.push(collaborators[id]);
            }
        }

        return Q(result);
    }




    function createFreeBusy(collaborators) {

        var collaborator;

        for(var id in collaborators) {
            if (collaborators.hasOwnProperty(id)) {
                collaborator = collaborators[id];
                collaborator.workscheduleEra.subtractEra(collaborator.eventsEra);
                collaborator.free = collaborator.workscheduleEra.periods;

                delete collaborator.workscheduleEra;
                delete collaborator.eventsEra;
            }
        }

        return Q(collaborators);
    }





    /**
     * Call the collaborators list service
     *
     *
     * @param {Object} params
     *                      params.dtstart                  search interval start
     *                      params.dtend                    serach interval end
     *                      params.user                     user ID to search in
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        var checkParams = require('../../../../modules/requestdateparams');

        if (!checkParams(service, params)) {
            return service.deferred.promise;
        }

        if (!params.manager && (undefined === params.user || null === params.user)) {
            service.error('user parameter is mandatory');
            return service.deferred.promise;
        }

        if (params.manager && (undefined === params.department || null === params.department)) {
            service.error('department parameter is mandatory');
            return service.deferred.promise;
        }


        /**
         * @return {Query}
         */
        function findEvents(users) {
            var find = service.app.db.models.CalendarEvent.find();

            find.where('user.id').in(users);
            find.where('status').in(['TENTATIVE', 'CONFIRMED']);

            find.or([
                { rrule: { $exists: true } },
                { $and:
                    [
                        { rrule: { $exists: false } },
                        { dtend: { $gt: params.dtstart } },
                        { dtstart: { $lt: params.dtend } }
                    ]
                }
            ]);

            find.populate('user.id');

            return find;
        }



        /**
         * @return {Promise}
         */
        function getEvents(userAccounts) {

            var users = userAccounts.map(function(u) {
                return u.id;
            });

            var deferred = Q.defer();

            findEvents(users).exec(function(err, docs) {

                if (err) {
                    return deferred.reject(err);
                }

                var getExpandedEra = require('../../../../modules/getExpandedEra');
                var era = getExpandedEra(docs, params.dtstart, params.dtend);
                deferred.resolve(addUid(era.periods));
            });

            return deferred.promise;
        }


        /**
         * Add working times to collaborators
         * @param {Array} userAccounts
         * @return {Promise}
         */
        function getWorkingTimes(userAccounts) {

            var deferred = Q.defer();

            var users = [];
            var promisedWorkingTimes = [];
            userAccounts.forEach(function(user) {
                users.push(user.id);
                promisedWorkingTimes.push(
                    user.roles.account.getPeriodScheduleEvents(params.dtstart, params.dtend)
                );
            });

            Q.all(promisedWorkingTimes).then(function(workingTimes) {



                for(var i=0; i< workingTimes.length; i++) {
                    collaborators[users[i]].workscheduleEra = workingTimes[i];
                    collaborators[users[i]].workingtimes = addUid(workingTimes[i].periods);
                }

                deferred.resolve(userAccounts);
            });

            return deferred.promise;
        }


        var usersPromise;

        if (params.user) {
            usersPromise = getUser(params.user).then(getUsers);
        }

        if (params.manager && params.department) {
            usersPromise = getDepartmentUsers(params.department);
        }


        usersPromise
            .then(filterAccounts)
            .then(populateCollaborators)
            .then(getWorkingTimes)
            .then(getEvents)
            .then(groupByCollaborator)
            .then(createFreeBusy)
            .then(function(objects) {

            service.deferred.resolve(objects);
        }, service.error);

        return service.deferred.promise;
    };


    return service;
};





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

        userAccounts.forEach(function(user) {
            if (undefined === collaborators[user.id]) {
                collaborators[user.id] = user.toObject();
                collaborators[user.id].events = [];
            }
        });

        return Q(userAccounts);
    }



    /**
     * @return {Promise}
     */
    function addUid(events) {

        function fixEvent(event) {
            event = event.toObject();
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

        return Q(events.map(fixEvent));
    }




    /**
     * @return {Promise}
     */
    function groupByCollaborator(events) {


        events.forEach(function(event) {

            var collaborator = event.user.id;

            if (undefined === collaborators[collaborator.id]) {
                throw new Error('Missing collaborator');
            }

            collaborators[collaborator.id].events.push(event);
        });

        var result = [];
        for(var id in collaborators) {
            if ( collaborators.hasOwnProperty(id)) {
                result.push(collaborators[id]);
            }
        }

        return Q(result);
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

        if (undefined === params.user || null === params.user) {
            return service.error('user parameter is mandatory');
        }


        function getEvents(userAccounts) {

            var deferred = Q.defer();


            var find = service.app.db.models.CalendarEvent.find();

            var users = userAccounts.map(function(u) {
                return u.id;
            });

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
            find.exec(function(err, docs) {

                if (err) {
                    return deferred.reject(err);
                }

                var getExpandedEra = require('../../../../modules/getExpandedEra');
                var era = getExpandedEra(docs);
                deferred.resolve(era.periods);
            });

            return deferred.promise;
        }





        getUser(params.user)
            .then(getUsers)
            .then(filterAccounts)
            .then(populateCollaborators)
            .then(getEvents)
            .then(addUid)
            .then(groupByCollaborator)
            .then(function(objects) {

            service.deferred.resolve(objects);
        }, service.error);

        return service.deferred.promise;
    };


    return service;
};





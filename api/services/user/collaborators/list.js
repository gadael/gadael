'use strict';


/**
 * The collaborators list service
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


    function getUser(userId) {

        var find = service.app.db.models.User.find();
        find.where('user.id').equals(userId);
        find.populate('department');

        return find.exec();
    }


    function getUsers(user) {
        return user.department.getUsers();
    }

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


    function addUid(events) {

        return events.map(function(event) {
            event = event.toObject();
            if (undefined === event.uid || null === event.uid || '' === event.uid) {
                event.uid = event._id;
            }

            // do not give personal informations to collaborators
            // TODO: this could be a parameter
            event.summary = '';

            return event;
        });
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

            var find = service.app.db.models.CalendarEvent.find();

            find.where('user.id').in(userAccounts.map(function(u) {
                return u.id;
            }));

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


            return find.exec();
        }






        getUser(params.user)
            .then(getUsers)
            .then(filterAccounts)
            .then(getEvents)
            .then(addUid)
            .then(function(objects) {

            service.resolve(objects);
        }, service.error);

        return service.deferred.promise;
    };


    return service;
};





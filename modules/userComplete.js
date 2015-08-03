'use strict';

/**
 * Add informations to the user object
 * module used by the admin users service, for get and list
 * and by the current logged in user (/rest/user)
 *
 * @param {document} userDoc mongoose user document
 *
 * @return {Promise} resolve to a user object
 */
exports = module.exports = function userComplete(userDoc)
{
    var user = userDoc.toObject();
    var Q = require('q');
    var deferred = Q.defer();

    var collectionPromise, calendarPromise, departmentsPromise;

    if (userDoc.roles.account) {
        collectionPromise = userDoc.roles.account.getCurrentCollection();
        calendarPromise = userDoc.roles.account.getCurrentScheduleCalendar();
    } else {
        collectionPromise = Q(null);
        calendarPromise = Q(null);
    }

    if (userDoc.roles.manager) {
        departmentsPromise = userDoc.roles.manager.getManagedDepartments();
    } else {
        departmentsPromise = Q(null);
    }


    if (!userDoc.roles.account) {
        deferred.resolve(user);
    } else {

        Q.all([
            collectionPromise,
            calendarPromise,
            departmentsPromise
        ]).then(function(results) {

            var collection = results[0];
            var calendar = results[1];
            var departments = results[2];

            if (null !== collection) {
                user.roles.account.currentCollection = collection.toObject();
            }

            if (null !== calendar) {
                user.roles.account.currentScheduleCalendar = calendar.toObject();
            }

            if (null !== departmentsPromise) {
                user.roles.manager.department = departments.map(function(d) {
                    return d.toObject();
                });
            }

            deferred.resolve(user);
        })
        .catch(deferred.reject);
    }

    return deferred.promise;
};

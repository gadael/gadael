'use strict';

let Q = require('q');

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
    var deferred = Q.defer();

    if (!userDoc.roles.account && !userDoc.roles.manager) {
        deferred.resolve(user);
    }

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



    Promise.all([
        collectionPromise,
        calendarPromise,
        departmentsPromise
    ]).then(function(results) {

        var collection = results[0];
        var calendar = results[1];
        var departments = results[2];

        if (null !== collection && undefined !== collection) {
            user.roles.account.currentCollection = collection.toObject();
        }

        if (null !== calendar && undefined !== calendar) {
            user.roles.account.currentScheduleCalendar = calendar.toObject();
        }

        if (null !== departments && undefined !== departments) {
            var usersPromises = [], department;

            departments.forEach(function(d) {
                usersPromises.push(d.getUsers());
            });

            user.roles.manager.department = [];

            Promise.all(usersPromises).then(function(usersResults) {
                for (var i=0; i<departments.length; i++) {
                    department = departments[i].toObject();
                    department.members = usersResults[i].length;
                    user.roles.manager.department.push(department);
                }

                deferred.resolve(user);
            });

        } else {

            deferred.resolve(user);
        }
    })
    .catch(deferred.reject);


    return deferred.promise;
};

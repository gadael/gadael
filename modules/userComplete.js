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

    return new Promise((resolve, reject) => {



        if (!userDoc.roles.account && !userDoc.roles.manager) {
            resolve(user);
        }

        var collectionPromise, calendarPromise, departmentsPromise;

        if (userDoc.roles.account) {
            collectionPromise = userDoc.roles.account.getCurrentCollection();
            calendarPromise = userDoc.roles.account.getCurrentScheduleCalendar();
        } else {
            collectionPromise = Promise.resolve(null);
            calendarPromise = Promise.resolve(null);
        }

        if (userDoc.roles.manager) {
            departmentsPromise = userDoc.roles.manager.populate('department').execPopulate()
            .then(manager => {
                return manager.department;
            });
        } else {
            departmentsPromise = Promise.resolve(null);
        }



        Promise.all([
            collectionPromise,
            calendarPromise,
            departmentsPromise
        ]).then(function(results) {

            var collection = results[0];
            var calendar = results[1];
            var departments = results[2];

            if (user.roles.account) {
                user.roles.account.currentCollection = null;

                if (null !== collection && undefined !== collection) {
                    user.roles.account.currentCollection = collection.toObject();
                }

                if (null !== calendar && undefined !== calendar) {
                    user.roles.account.currentScheduleCalendar = calendar.toObject();
                }
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

                    resolve(user);
                });

            } else {

                resolve(user);
            }
        })
        .catch(reject);


    });
};

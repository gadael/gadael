'use strict';

const rolesupdated = require('../../../../modules/emails/rolesupdated');

/**
 * Validate params fields
 *
 */
function validate(service, params) {

    if (service.needRequiredFields(params, ['firstname', 'lastname',  'email'])) {
        return;
    }

    processPassword(service, params);
}



/**
 * Set the password property of params object to the password hash
 * @param {apiService} service
 * @param {object} params
 */
function processPassword(service, params) {

    var User = service.app.db.models.User;

    if (params.newpassword !== undefined) {
        User.encryptPassword(params.newpassword)
        .then(hash => {
            params.password = hash;
            saveUser(service, params);
        })
        .catch(service.forbidden);

        return;
    }


    saveUser(service, params);
}





/**
 * Update/create the user document
 */
function saveUser(service, params) {

    const gt = service.app.utility.gettext;

    let User = service.app.db.models.User;

    let fieldsToSet = {
        firstname: params.firstname,
        lastname: params.lastname,
        email: params.email,
        image: params.image,
        isActive: params.isActive
    };

    if (params.department) {
        fieldsToSet.department = params.department._id;
    }

    if (params.password) {
        fieldsToSet.password = params.password;
    }

    if (params.google && params.google.calendar) {
        if (undefined === fieldsToSet.google) {
            fieldsToSet.google = {};
        }

        fieldsToSet.google.calendar = params.google.calendar;
    }


    function onError(err) {
        if (err.code === 11000) {
            err = new Error(gt.gettext('This email is already used'));
        }
        service.error(err);
    }


    if (params.id)
    {
        User.findById(params.id, function (err, user) {
            if (service.handleMongoError(err))
            {
                user.set(fieldsToSet);

                user.save()
                .then(function(user) {
                    return saveUserRoles(service, params, user);
                })
                .then(newRoles => {

                    service.success(gt.gettext('The user has been modified'));

                    let output = user.toObject();
                    output.$outcome = service.outcome;
                    service.deferred.resolve(output);

                    // Notify the user about is roles updates
                    return sendRolesUpdates(service.app, user, newRoles);
                })
                .catch(onError);
            }
        });

    } else {

        let user = new User();
        user.set(fieldsToSet);

        user.save()
        .then(user => {
            return saveUserRoles(service, params, user);
        })
        .then(() => {
            service.success(gt.gettext('The user has been created'));

            let output = user.toObject();
            output.$outcome = service.outcome;
            service.deferred.resolve(output);

            //TODO: send email for user creation?
        })
        .catch(onError);
    }
}


function getRoleObject(checked, object) {

    if (!checked) {
        return null;
    }

    if (undefined === object) {
        object = {};
    }

    return object;
}


/**
 * @return {Promise}
 */
function saveUserRoles(service, params, userDocument) {

    const gt = service.app.utility.gettext;

    if (!userDocument) {
        return service.notFound(gt.gettext('No user document to save roles on'));
    }

    const saveRoles = require('../../../../modules/roles');

    if (undefined === params.roles) {
        params.roles = {};
    }

    let account = getRoleObject(params.isAccount, params.roles.account);
    let admin = getRoleObject(params.isAdmin, {});
    let manager = getRoleObject(params.isManager, params.roles.manager);


    let newRoles = [];
    if (!userDocument.roles.account && null !== account) {
        newRoles.push(gt.gettext('Absence account'));
    }

    if (!userDocument.roles.manager && null !== manager) {
        newRoles.push(gt.gettext('Department manager'));
    }

    if (!userDocument.roles.admin && null !== admin) {
        newRoles.push(gt.gettext('Application administrator'));
    }

    return new Promise((resolve, reject) => {
        saveRoles(
            service.app.db.models,
            userDocument,
            account,
            admin,
            manager,
            function updateUserWithSavedRoles(err, results) {

                if (err) {
                    return reject(err);
                }


                userDocument.save(function(err) {
                    if (err) {
                        return reject(err);
                    }

                    resolve(newRoles);

                });
            }
        );
    });

}


/**
 * Send roles update emails
 * @return {Promise}
 */
function sendRolesUpdates(app, userDocument, newRoles) {
    if (newRoles.length > 0) {
        return rolesupdated(app, userDocument, newRoles)
        .then(mail => {
            return mail.send();
        });
    }

    // Nothing to notify
    return Promise.resolve(true);
}








exports = module.exports = function(services, app) {

    var service = new services.save(app);

    /**
     * Call the users save service
     *
     * @param {Object} user
     *
     * @return {Query}
     */
    service.getResultPromise = function(params) {

        validate(service, params);
        return service.deferred.promise;
    };


    return service;
};

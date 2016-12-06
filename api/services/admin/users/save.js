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
        User.encryptPassword(params.newpassword, function(err, hash) {

            if (err) {
                return service.forbidden(err);
            }

            params.password = hash;
            saveUser(service, params);
        });

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


    if (params.id)
    {
        User.findById(params.id, function (err, user) {
            if (service.handleMongoError(err))
            {
                user.set(fieldsToSet);

                user.save(function(err) {
                    if (service.handleMongoError(err)) {

                        service.success(gt.gettext('The user has been modified'));

                        saveUserRoles(service, params, user);
                    }
                });
            }
        });

    } else {

        let user = new User();
        user.set(fieldsToSet);

        user.save()
        .then(userDocument => {

            service.success(gt.gettext('The user has been created'));
            saveUserRoles(service, params, userDocument);

        })
        .catch(service.error);
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
 *
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

    saveRoles(
        service.app.db.models,
        userDocument,
        account,
        admin,
        manager,
        function updateUserWithSavedRoles(err, results) {

            if (service.handleMongoError(err)) { // error forwarded by async

                userDocument.save(function(err) {
                    if (service.handleMongoError(err)) { // error for user document

                        var output = userDocument.toObject();
                        output.$outcome = service.outcome;

                        service.deferred.resolve(output);
                    }
                });
            }
        }
    );


    // notify about the new roles
    if (newRoles.length > 0) {
        rolesupdated(service.app, userDocument, newRoles)
        .then(mail => {
            mail.send();
        });
    }
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

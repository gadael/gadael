'use strict';


const gt = require('./../../../../modules/gettext');

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
    
    
/**
 * 
 */
function saveUserRoles(service, params, userDocument) {

    if (!userDocument) {
        return service.notFound(gt.gettext('No user document to save roles on'));
    }

    var saveRoles = require('../../../../modules/roles');

    var account = null;

    if (params.roles !== undefined && params.roles.account !== undefined) {
        account = params.roles.account;
    }

    if (undefined !== params.isAccount && !params.isAccount) {
        // account was unchecked
        account = null;
    }


    var admin = params.isAdmin ? {} : null;
    
    var manager = null;

    if (params.roles !== undefined && params.roles.manager !== undefined) {
        manager = params.roles.manager;
    }

    if (undefined !== params.isManager && !params.isManager) {
        manager = null;
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



'use strict';



/**
 * Validate params fields
 * 
 */
function validate(service, params) {

    if (service.needRequiredFields(params, ['firstname', 'lastname',  'email'])) {
        return;
    }

    saveUser(service, params);
}
    
    
/**
 * Update/create the user document
 */  
function saveUser(service, params) {
    
    var User = service.app.db.models.User;

    if (params.id)
    {
        User.findById(params.id, function (err, user) {
            if (service.handleMongoError(err))
            {
                user.firstname 	= params.firstname;
                user.lastname 	= params.lastname;
                user.email 		= params.email;
                user.department = params.department ? params.department._id : undefined;
                user.isActive   = params.isActive;

                user.save(function(err) {
                    if (service.handleMongoError(err)) {

                        service.success(service.gt.gettext('The user has been modified'));
                        
                        saveUserRoles(service, params, user);
                    }
                });
            }
        });

    } else {

        User.create({
            firstname: params.firstname,
            lastname: params.lastname,
            email: params.email,
            department: params.department,
            password: params.newpassword,
            isActive: params.isActive 
        }, function(err, userDocument) {

            if (service.handleMongoError(err))
            {
                service.success(service.gt.gettext('The user has been created'));

                saveUserRoles(service, params, userDocument);
            }
        });
    }
}
    
    
/**
 * 
 */
function saveUserRoles(service, params, userDocument) {

    if (!userDocument) {
        return service.notFound(service.gt.gettext('No user document to save roles on'));
    }

    var saveRoles = require('../../../../modules/roles');

    var account = params.isAccount ? params.roles.account : null;
    var admin = params.isAdmin ? {} : null;
    var manager = params.isManager ? {} : null;

    
                        

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



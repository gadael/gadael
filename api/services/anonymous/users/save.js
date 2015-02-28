'use strict';


var Gettext = require('node-gettext');
var gt = new Gettext();

/**
 * Validate params fields
 *
 */
function validate(service, params) {

    if (service.needRequiredFields(params, ['firstname', 'lastname',  'email', 'password'])) {
        return;
    }

    createFirstAdmin(service, params);
}


/**
 * Create the first admin
 */
function createFirstAdmin(service, params) {


    var User = service.app.db.models.User;


    User.count({}, function( err, count){
        if (0 !== count) {
            service.accessDenied(gt.gettext('The first admin is allready created, you must login into the application to create other users'));
            return;
        }

        User.create({
            firstname: params.firstname,
            lastname: params.lastname,
            email: params.email,
            password: params.password
        }, function(err, userDocument) {

            if (service.handleMongoError(err))
            {
                service.success(gt.gettext('The user has been created'));
            }
        });

    });
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



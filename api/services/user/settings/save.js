'use strict';



/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params)
{

    if (service.needRequiredFields(params, ['user', 'lastname', 'firstname', 'email'])) {
        return;
    }

    saveUser(service, params);
}









/**
 * Update/create the user document
 *
 * @param {apiService} service
 * @param {Object} params
 */
function saveUser(service, params) {

    var Gettext = require('node-gettext');
    var gt = new Gettext();


    var UserModel = service.app.db.models.User;


    var fieldsToSet = {
        firstname: params.firstname,
        lastname: params.lastname,
        email: params.email
    };

    UserModel.findByIdAndUpdate(params.user, fieldsToSet, function(err, user) {

        if (service.handleMongoError(err)) {
            service.resolveSuccess(
                user,
                gt.gettext('Your settings has been modified')
            );
        }

    });
}










/**
 * Construct the settings save service
 * @param   {object}          services list of base classes from apiService
 * @param   {express|object}  app      express or headless app
 * @returns {saveItemService}
 */
exports = module.exports = function(services, app) {

    var service = new services.save(app);

    /**
     * Call the right type save service
     *
     * @param {Object} params
     *
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        validate(service, params);
        return service.deferred.promise;
    };


    return service;
};



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



function resolve(service, user, account)
{
    const gt = require('./../../../../modules/gettext');

    // do not return the full user document for security reasons

    var savedUser = {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email
    };

    if (null !== account) {
        savedUser.roles = {
            account: {
                notify: {
                    approvals: account.notify.approvals,
                    allocations: account.notify.allocations
                }
            }
        };
    }

    service.resolveSuccess(
        savedUser,
        gt.gettext('Your settings has been modified')
    );
}





/**
 * Update/create the user document
 *
 * @param {apiService} service
 * @param {Object} params
 */
function saveUser(service, params) {





    var UserModel = service.app.db.models.User;
    var AccountModel = service.app.db.models.Account;

    var fieldsToSet = {
        firstname: params.firstname,
        lastname: params.lastname,
        email: params.email,
        image: params.image
    };

    UserModel.findByIdAndUpdate(params.user, fieldsToSet, function(err, user) {

        if (service.handleMongoError(err)) {

            if (undefined !== params.roles.account.notify) {

                var fieldsToSet = {
                    notify: {
                        approvals: params.roles.account.notify.approvals,
                        allocations: params.roles.account.notify.allocations
                    }
                };

                AccountModel.findByIdAndUpdate(user.roles.account, fieldsToSet, function(err, account) {

                    if (service.handleMongoError(err)) {
                        resolve(service, user, account);
                    }
                });

                return;
            }


            resolve(service, user, null);
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



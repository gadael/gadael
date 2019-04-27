'use strict';

const crypto = require('crypto');

/**
 * Validate params fields
 *
 */
function validate(service, params) {

    if (service.needRequiredFields(params, ['userId'])) {
        return;
    }

    saveToken(service, params);
}



/**
 * Update/create the user document
 */
function saveToken(service, params) {

    const gt = service.app.utility.gettext;
    const User = service.app.db.models.User;
    User.findById(params.userId, function (err, user) {
        if (service.handleMongoError(err))
        {
            user.api = {
                clientId: crypto.randomBytes(24).toString('hex'),
                clientSecret: crypto.randomBytes(24).toString('hex')
            };

            user.save()
            .then(function(document) {
                service.resolveSuccessGet(
                    document._id,
                    gt.gettext('The API token has been created')
                );
            })
            .catch(service.error);
        }
    });
}


exports = module.exports = function(services, app) {
    const service = new services.save(app);

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

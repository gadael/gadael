'use strict';

const crypto = require('crypto');

/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {

    if (service.needRequiredFields(params, ['email'])) {
        return;
    }

    saveRightType(service, params);
}


/**
 * Update/create the invitation document
 *
 * @param {apiService} service
 * @param {Object} params
 */
function saveRightType(service, params) {

    const gt = service.app.utility.gettext;

    var InvitationModel = service.app.db.models.Invitation;

    var fieldsToSet = {
        email: params.email,
        department: params.department,
    };


    if (params.id)
    {
        // Update the invitation, not used

        InvitationModel.findOne({ _id: params._id })
        .exec((err, invitation) => {
            if (service.handleMongoError(err)) {

                invitation.set(fieldsToSet);

                invitation.save((err, document) => {
                    if (service.handleMongoError(err))
                    {
                        service.resolveSuccessGet(
                            document._id,
                            gt.gettext('The invitation has been modified')
                        );
                    }
                });
            }
        });


    } else {

        crypto.randomBytes(48, function(err, tokenBuffer) {

            if (err) {
                return service.error(err);
            }

            let invitation = new InvitationModel();
            invitation.set(fieldsToSet);
            invitation.emailToken = tokenBuffer.toString('hex');

            // TODO: send the email

            invitation.save((err, document) => {

                if (service.handleMongoError(err))
                {
                    service.resolveSuccessGet(
                        document._id,
                        gt.gettext('The invitation has been created')
                    );
                }
            });

        });
    }

}










/**
 * Construct the invitation save service
 * @param   {object}          services list of base classes from apiService
 * @param   {express|object}  app      express or headless app
 * @returns {saveItemService}
 */
exports = module.exports = function(services, app) {

    var service = new services.save(app);

    /**
     * Call the invitation save service
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

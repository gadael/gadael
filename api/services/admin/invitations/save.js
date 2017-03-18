'use strict';



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
        department: params.department._id
    };


    if (params.id)
    {
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

        let invitation = new InvitationModel();
        invitation.set(fieldsToSet);

        invitation.save((err, document) => {

            if (service.handleMongoError(err))
            {
                service.resolveSuccessGet(
                    document._id,
                    gt.gettext('The invitation has been created')
                );
            }
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

'use strict';



/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {

    if (service.needRequiredFields(params, ['name'])) {
        return;
    }

    saveRightType(service, params);
}


/**
 * Update/create the right type document
 *
 * @param {apiService} service
 * @param {Object} params
 */
function saveRightType(service, params) {

    const gt = service.app.utility.gettext;

    var TypeModel = service.app.db.models.Type;


    var fieldsToSet = {
        name: params.name,
        groupFolded: params.groupFolded,
        groupTitle: params.groupTitle,
        sortkey: params.sortkey,
        color: params.color
    };


    if (params.id)
    {
        TypeModel.findOne({ _id: params._id }).exec((err, type) => {
            if (service.handleMongoError(err)) {

                if (type.locked) {
                    return service.forbidden(gt.gettext('This type is locked'));
                }

                type.set(fieldsToSet);

                type.save((err, document) => {
                    if (service.handleMongoError(err))
                    {
                        service.resolveSuccessGet(
                            document._id,
                            gt.gettext('The right type has been modified')
                        );
                    }
                });
            }
        });


    } else {

        let type = new TypeModel();
        type.set(fieldsToSet);

        type.save((err, document) => {

            if (service.handleMongoError(err))
            {
                service.resolveSuccessGet(
                    document._id,
                    gt.gettext('The right type has been created')
                );
            }
        });
    }
}










/**
 * Construct the type save service
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

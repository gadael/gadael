'use strict';




/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {

    if (service.needRequiredFields(params, ['name', 'quantity', 'quantity_unit'])) {
        return;
    }

    saveRecoverQuantity(service, params);
}


/**
 * Update/create the recover quantity document
 *
 * @param {apiService} service
 * @param {Object} params
 */
function saveRecoverQuantity(service, params) {

    const gt = service.app.utility.gettext;

    var QuantityModel = service.app.db.models.RecoverQuantity;

    var fieldsToSet = {
        name: params.name,
        quantity: params.quantity,
        quantity_unit: params.quantity_unit
    };

    if (params.id)
    {
        QuantityModel.findByIdAndUpdate(params.id, fieldsToSet, function(err, document) {
            if (service.handleMongoError(err))
            {
                service.resolveSuccessGet(
                    document._id,
                    gt.gettext('The recover quantity has been modified')
                );
            }
        });

    } else {

        QuantityModel.create(fieldsToSet, function(err, document) {

            if (service.handleMongoError(err))
            {
                service.resolveSuccessGet(
                    document._id,
                    gt.gettext('The recover quantity has been created')
                );
            }
        });
    }
}










/**
 * Construct the recover quantity save service
 * @param   {object}          services list of base classes from apiService
 * @param   {express|object}  app      express or headless app
 * @returns {saveItemService}
 */
exports = module.exports = function(services, app) {

    var service = new services.save(app);

    /**
     * Call the recover quantity save service
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

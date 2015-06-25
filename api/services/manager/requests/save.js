'use strict';



/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params)
{

    if (service.needRequiredFields(params, ['id', 'user', 'approvalStep'])) {
        return;
    }

    saveRequest(service, params);
}






/**
 * Update/create the request document
 *
 * @param {apiService} service
 * @param {Object} params
 */
function saveRequest(service, params) {

    var Gettext = require('node-gettext');
    var gt = new Gettext();

    var RequestModel = service.app.db.models.Request;

    var filter = {
        'id': params.id,
        'approvalStep.approvers': params.user
    };

    RequestModel.findOne(filter, function(err, document) {
        if (service.handleMongoError(err)) {

            //document.set(fieldsToSet);

            // TODO add log entry
            // TODO notify next approver or appliquant

            service.resolveSuccess(
                document,
                gt.gettext('The request has been modified')
            );
        }
    });

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



'use strict';



/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params)
{
    if (service.needRequiredFields(params, ['id', 'user', 'approvalStep', 'action'])) {
        return;
    }

    if (!params.action.indexOf(['wf_accept', 'wf_reject'])) {
        return service.error('invalid value for action, a manager can only accept or reject a request');
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
        '_id': params.id
    };

    RequestModel.findOne(filter).exec(function(err, document) {
        if (service.handleMongoError(err)) {

            if (!document) {
                return service.notFound('Request not found');
            }


            var approvalStep = document.approvalSteps.id(params.approvalStep);




            if ('wf_accept' === params.action) {
                document.accept(approvalStep, params.user, params.comment);
            }

            if ('wf_reject' === params.action) {
                document.reject(approvalStep, params.user, params.comment);
            }

            document.save(function(err, request) {
                service.resolveSuccess(
                    document,
                    gt.gettext('The request has been modified')
                );
            });


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



'use strict';

const util = require('util');


/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {

    if (service.needRequiredFields(params, ['rightRenewal', 'user', 'quantity', 'userCreated', 'beneficiary'])) {
        return;
    }

    saveAdjustment(service, params);
}





/**
 * Update/create the Adjustment document
 *
 * @param {saveItemService} service
 * @param {Object} params
 */
function saveAdjustment(service, params) {

    const gt = service.app.utility.gettext;
    const Adjustment = service.app.db.models.Adjustment;



    function getDocument() {
        if (!params._id) {
            let document = new Adjustment();
            document.rightRenewal = params.rightRenewal;
            document.user = params.user;
            document.quantity = params.quantity;
            document.comment = params.comment;
            document.userCreated = {
                id: params.userCreated._id,
                name: params.userCreated.getName()
            };
            return Promise.resolve(document);
        }

        return Adjustment.findOne({ _id: params._id })
        .then(document => {
            if (null === document) {
                throw new Error(util.format(gt.gettext('Adjustment document not found for id %s'), params.id));
            }

            document.rightRenewal = params.rightRenewal;
            document.user 	      = params.user;
            document.quantity     = params.quantity;
            document.comment      = params.comment;
            return document;
        });
    }



    getDocument()
    .catch(service.notFound)
    .then(document => {
        return document.save();
    })
    .then(document => {
        return document.updateUsersStat(params.beneficiary)
        .then(() => {
            return document;
        });
    })
    .catch(service.error)
    .then(document => {

        let message = params._id ?
            gt.gettext('The adjustment has been modified') :
            gt.gettext('The quantity adjustment has been created');

        service.resolveSuccess(document, message);
    });

}










/**
 * Construct the Adjustments save service
 * @param   {object}          services list of base classes from apiService
 * @param   {express|object}  app      express or headless app
 * @returns {saveItemService}
 */
exports = module.exports = function(services, app) {

    var service = new services.save(app);

    /**
     * Call the adjustments save service
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

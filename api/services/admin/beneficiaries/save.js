'use strict';

const gt = require('./../../../../modules/gettext');
const util = require('util');


/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {

    if (service.needRequiredFields(params, ['right', 'document', 'ref'])) {
        return;
    }

    saveBeneficiary(service, params);
}





/**
 * Update/create the Beneficiary document
 *
 * @param {saveItemService} service
 * @param {Object} params
 */
function saveBeneficiary(service, params) {



    var Beneficiary = service.app.db.models.Beneficiary;



    if (params._id) {


        Beneficiary.findById(params._id, function(err, document) {
            if (service.handleMongoError(err)) {
                if (null === document) {
                    service.notFound(util.format(gt.gettext('beneficiary document not found for id %s'), params.id));
                    return;
                }

                document.right 	  = params.right._id;
                document.ref 	  = params.ref;
                document.document = params.document;

                document.save(function (err) {

                    if (service.handleMongoError(err)) {

                        service.resolveSuccessGet(
                            document._id,
                            gt.gettext('The right association has been modified')
                        );
                    }
                });
            }
        });

    } else {


        Beneficiary.create({
                right: params.right._id,
                document: params.document,
                ref: params.ref
            }, function(err, document) {

            if (service.handleMongoError(err))
            {
                service.resolveSuccessGet(
                    document._id,
                    gt.gettext('The right association has been created')
                );
            }
        });

    }
}










/**
 * Construct the AccountCollection save service
 * @param   {object}          services list of base classes from apiService
 * @param   {express|object}  app      express or headless app
 * @returns {saveItemService}
 */
exports = module.exports = function(services, app) {

    var service = new services.save(app);

    /**
     * Call the beneficiaries save service
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

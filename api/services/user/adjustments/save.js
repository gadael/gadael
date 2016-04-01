'use strict';



/**
 * Validate params fields
 * @param {apiService} service
 * @param {Object} params
 */
function validate(service, params) {

    if (service.needRequiredFields(params, ['rightRenewal', 'user', 'quantity', 'userCreated'])) {
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

    var gt = require('./../../../../modules/gettext');


    var Adjustment = service.app.db.models.Adjustment;
    var util = require('util');


    if (params._id) {


        Adjustment.findById(params._id, function(err, document) {
            if (service.handleMongoError(err)) {
                if (null === document) {
                    service.notFound(util.format(gt.gettext('Adjustment document not found for id %s'), params.id));
                    return;
                }

                document.rightRenewal = params.rightRenewal;
                document.user 	      = params.user;
                document.quantity     = params.quantity;
                document.comment      = params.comment;

                document.save(function (err) {

                    if (service.handleMongoError(err)) {

                        service.resolveSuccess(
                            document,
                            gt.gettext('The adjustment has been modified')
                        );
                    }
                });
            }
        });

    } else {


        Adjustment.create({
                rightRenewal: params.rightRenewal,
                user: params.user,
                quantity: params.quantity,
                comment: params.comment,
                userCreated: {
                    id: params.userCreated._id,
                    name: params.userCreated.getName()
                }
            }, function(err, document) {

            if (service.handleMongoError(err))
            {
                service.resolveSuccess(
                    document,
                    gt.gettext('The quantity adjustment has been created')
                );
            }
        });

    }
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



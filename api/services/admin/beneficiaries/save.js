'use strict';


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

    const gt = service.app.utility.gettext;
    const Beneficiary = service.app.db.models.Beneficiary;
    const Right = service.app.db.models.Right;

    function getBeneficiaryPromise() {



        if (!params._id) {
            return Promise.resolve(new Beneficiary());
        }

        return Beneficiary.findOne({ _id: params._id })
        .exec()
        .then(beneficiary => {
            if (null === beneficiary) {
                throw new Error(util.format(gt.gettext('beneficiary document not found for id %s'), params.id));
            }

            return beneficiary;
        });
    }


    function getRightPromise() {

        return Right.findOne({ _id: params.right._id })
        .exec()
        .then(right => {
            if (null === right) {
                throw new Error(util.format(gt.gettext('right document not found for id %s'), params.right._id));
            }

            return right;
        });
    }

    /**
     * Ensure one type per right
     */
    function checkRefType(right) {
        switch(params.ref) {
            case 'User':
                return right.canLinkToUser();
            case 'RightCollection':
                return right.canLinkToCollection();
        }

        throw new Error('Wrong ref value');
    }


    function getSuccessMessage() {
        if (params._id) {
            return gt.gettext('The right association has been modified');
        }

        return gt.gettext('The right association has been created');
    }


    Promise.all([
        getRightPromise(),
        getBeneficiaryPromise()
    ])
    .then(all => {

        let right       = all[0];
        let beneficiary = all[1];

        checkRefType(right)
        .then(() => {
            beneficiary.right 	  = right.id;
            beneficiary.ref 	  = params.ref;
            beneficiary.document  = params.document;
            if ('User' === beneficiary.ref) {
                beneficiary.from      = params.from;
                beneficiary.to        = params.to;
            } else {
                beneficiary.from      = null;
                beneficiary.to        = null;
            }

            return beneficiary.save();
        })
        .then(beneficiary => {
            service.resolveSuccessGet(
                beneficiary._id,
                getSuccessMessage()
            );
        })
        .catch(service.error);
    })
    .catch(service.notFound);

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

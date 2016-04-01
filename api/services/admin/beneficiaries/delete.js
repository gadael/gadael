'use strict';








exports = module.exports = function(services, app) {

    var service = new services.delete(app);


    var gt = require('./../../../../modules/gettext');

    /**
     * Validate before delete
     * @param   {AccountCollection}  document mongoose document
     * @returns {Boolean}
     */
    function validate(document) {

        if (!document) {
            service.notFound(gt.gettext('this right does not exists or is not linked to account or collection'));
            return false;
        }

        return true;
    }




    /**
     * Call the beneficiaries delete service
     *
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {



        service.app.db.models.Beneficiary.findById(params.id, function (err, document) {
            if (service.handleMongoError(err)) {

                if (!validate(document)) {
                    return;
                }

                document.remove(function(err) {
                    if (service.handleMongoError(err)) {

                        if ('User' === document.ref) {
                            service.success(gt.gettext('The right has been removed from user account'));
                        } else {
                            service.success(gt.gettext('The right has been removed from the collection'));
                        }

                        var beneficiary = document.toObject();
                        beneficiary.$outcome = service.outcome;

                        service.deferred.resolve(beneficiary);
                    }
                });
            }
        });

        return service.deferred.promise;
    };


    return service;
};


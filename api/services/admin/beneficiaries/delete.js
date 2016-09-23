'use strict';






exports = module.exports = function(services, app) {

    var service = new services.delete(app);

    const gt = app.utility.gettext;

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



        service.app.db.models.Beneficiary.findById(params.id)
        .then(document => {

            if (!validate(document)) {
                return;
            }

            let message;

            if ('User' === document.ref) {
                message = gt.gettext('The right has been removed from user account');
            } else {
                message = gt.gettext('The right has been removed from the collection');
            }

            return service.get(params.id)
            .then(object => {

                return document.remove()
                .then(() => {
                    service.resolveSuccess(object, message);
                });
            });
        });

        return service.deferred.promise;
    };


    return service;
};

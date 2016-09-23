'use strict';



exports = module.exports = function(services, app) {

    var service = new services.delete(app);

    const gt = app.utility.gettext;

    /**
     * Call the recover quantity delete service
     *
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        service.app.db.models.RecoverQuantity.findById(params.id)
        .then(document => {

            if (!document) {
                return service.notFound(gt.gettext('the recover quantity does not exists'));
            }

            return service.get(params.id)
            .then(object => {

                return document.remove()
                .then(() => {
                    service.resolveSuccess(object, gt.gettext('The recover quantity has been deleted'));
                });
            });
        })
        .catch(service.error);

        return service.deferred.promise;
    };


    return service;
};

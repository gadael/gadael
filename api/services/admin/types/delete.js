'use strict';


exports = module.exports = function(services, app) {

    var service = new services.delete(app);

    const gt = app.utility.gettext;

    /**
     * Call the types delete service
     *
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {



        service.app.db.models.Type.findById(params.id)
        .then(document => {

            if (document.locked) {
                return service.forbidden(gt.gettext('This type is locked'));
            }

            return service.get(params.id)
            .then(object => {

                return document.remove()
                .then(() => {
                    service.resolveSuccess(object, gt.gettext('The right type has been deleted'));
                });
            });

        });

        return service.deferred.promise;
    };


    return service;
};

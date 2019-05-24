'use strict';

exports = module.exports = function(services, app) {
    const service = new services.delete(app);
    const gt = app.utility.gettext;

    /**
     * Call the users delete service
     *
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        service.app.db.models.User.findById(params.id)
        .then(document => {
            if (null === document) {
                service.notFound(gt.gettext('User not found'));
                return;
            }

            return service.get(params.id)
            .then(object => {
                document.api = null;
                return document.save()
                .then(() => {
                    service.resolveSuccess(object, gt.gettext('User API token revoked'));
                });
            });
        })
        .catch(service.error);
        return service.deferred.promise;
    };


    return service;
};

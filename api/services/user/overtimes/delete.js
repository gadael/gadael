'use strict';

exports = module.exports = function(services, app) {
    var service = new services.delete(app);
    const gt = app.utility.gettext;

    /**
     * Call the overtime delete service
     *
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {
        service.app.db.models.Overtime.findById(params.id)
        .then(document => {
            if (!document) {
                return service.notFound(gt.gettext('the overtime does not exists'));
            }
            return service.get(params.id)
            .then(object => {
                return document.remove()
                .then(() => {
                    service.resolveSuccess(object, gt.gettext('The overtime has been deleted'));
                });
            });
        })
        .catch(service.error);
        return service.deferred.promise;
    };

    return service;
};

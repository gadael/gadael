'use strict';

exports = module.exports = function(services, app) {


    var service = new services.delete(app);

    const gt = app.utility.gettext;


    /**
     * Call the calendar delete service
     *
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {


        service.app.db.models.Calendar.findById(params.id)
        .then(document => {

            if (document.locked) {
                return service.forbidden(gt.gettext('The calendar is locked'));
            }

            return service.get(params.id)
            .then(object => {

                return document.remove()
                .then(() => {
                    service.resolveSuccess(object, gt.gettext('The calendar has been deleted'));
                });
            });

        })
        .catch(service.error);

        return service.deferred.promise;
    };


    return service;
};

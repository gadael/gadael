'use strict';


exports = module.exports = function(services, app) {

    const gt = app.utility.gettext;

    var service = new services.delete(app);

    /**
     * Call the departments delete service
     *
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {


        service.app.db.models.Department.findById(params.id)
        .then(document => {

            return service.get(params.id)
            .then(object => {

                return document.remove()
                .then(() => {
                    service.resolveSuccess(object, gt.gettext('The department has been deleted'));
                });
            });
        })
        .catch(service.error);

        return service.deferred.promise;
    };


    return service;
};

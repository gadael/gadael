'use strict';


exports = module.exports = function(services, app) {

    var service = new services.delete(app);

    const gt = app.utility.gettext;

    /**
     * Call the invitation delete service
     *
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {



        service.app.db.models.Invitation.findById(params.id)
        .then(document => {

            return service.get(params.id)
            .then(object => {

                return document.remove()
                .then(() => {
                    service.resolveSuccess(object, gt.gettext('The invitation has been deleted'));
                });
            });

        });

        return service.deferred.promise;
    };


    return service;
};

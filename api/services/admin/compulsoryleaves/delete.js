'use strict';


exports = module.exports = function(services, app) {

    var service = new services.delete(app);

    const gt = app.utility.gettext;

    /**
     * Call the compulsoryleave delete service
     *
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        let CompulsoryLeave = service.app.db.models.CompulsoryLeave;
        let documentPromise = CompulsoryLeave.findById(params.id)
        .populate('requests.request') // for the pre remove hook
        .exec();

        let objectPromise = service.get(params.id);

        Promise.all([documentPromise, objectPromise])
        .then(all => {
            return all[0].remove()
            .then(() => {
                service.resolveSuccess(all[1], gt.gettext('The compulsory leave has been deleted'));
            });
        })
        .catch(service.error);

        return service.deferred.promise;
    };


    return service;
};

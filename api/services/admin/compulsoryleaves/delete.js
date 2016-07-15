'use strict';

const gt = require('./../../../../modules/gettext');


exports = module.exports = function(services, app) {

    var service = new services.delete(app);

    /**
     * Call the compulsoryleave delete service
     *
     * @param {object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        let CompulsoryLeave = service.app.db.models.CompulsoryLeave;

        CompulsoryLeave.findById(params.id)
        .populate('requests.request')
        .exec()
        .then(document => {

            document.remove(function(err) {
                if (service.handleMongoError(err)) {
                    service.success(gt.gettext('The compulsory leave has been deleted'));

                    var compulsoryleave = document.toObject();
                    compulsoryleave.$outcome = service.outcome;

                    service.deferred.resolve(compulsoryleave);
                }
            });

        })
        .catch(service.error);

        return service.deferred.promise;
    };


    return service;
};


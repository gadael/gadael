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



        service.app.db.models.CompulsoryLeave.findById(params.id, function (err, document) {
            if (service.handleMongoError(err)) {
                document.remove(function(err) {
                    if (service.handleMongoError(err)) {
                        service.success(gt.gettext('The compulsory leave has been deleted'));

                        var compulsoryleave = document.toObject();
                        compulsoryleave.$outcome = service.outcome;

                        service.deferred.resolve(compulsoryleave);
                    }
                });
            }
        });

        return service.deferred.promise;
    };


    return service;
};


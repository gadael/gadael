'use strict';



exports = module.exports = function(services, app) {


    var service = new services.get(app);

    const gt = app.utility.gettext;

    /**
     * Call the overtime get service
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        if (params.id === undefined) {
            return service.forbidden('Missing id parameter');
        }

        service.app.db.models.Overtime
        .findOne({ '_id' : params.id})
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {
                    service.outcome.success = true;
                    service.deferred.resolve(document);
                } else {
                    service.notFound(gt.gettext('This overtime does not exists'));
                }
            }
        });

        return service.deferred.promise;
    };


    return service;
};

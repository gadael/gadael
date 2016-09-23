'use strict';



exports = module.exports = function(services, app) {


    var service = new services.get(app);

    const gt = app.utility.gettext;

    /**
     * Call the calendar get service
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        if (params.id === undefined) {
            return service.forbidden('Missing id parameter');
        }

        service.app.db.models.Calendar
        .findOne({ '_id' : params.id})
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {
                    service.outcome.success = true;
                    service.deferred.resolve(document);
                } else {
                    service.notFound(gt.gettext('This calendar does not exists'));
                }
            }
        });

        return service.deferred.promise;
    };


    return service;
};

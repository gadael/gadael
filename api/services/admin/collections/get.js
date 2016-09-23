'use strict';


exports = module.exports = function(services, app) {

    const gt = app.utility.gettext;

    var service = new services.get(app);

    /**
     * Call the collection get service
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        service.app.db.models.RightCollection
        .findOne({ '_id' : params.id})
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {
                    service.outcome.success = true;
                    service.deferred.resolve(document);
                } else {
                    service.notFound(gt.gettext('This collection does not exists'));
                }
            }
        });

        return service.deferred.promise;
    };


    return service;
};

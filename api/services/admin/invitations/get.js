'use strict';



exports = module.exports = function(services, app) {

    var service = new services.get(app);

    const gt = app.utility.gettext;

    /**
     * Call the invitations get service
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {


        service.app.db.models.Invitation
        .findOne({ '_id' : params.id})
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {
                    service.outcome.success = true;
                    service.deferred.resolve(document);
                } else {
                    service.notFound(gt.gettext('This invitation does not exists'));
                }
            }
        });

        return service.deferred.promise;
    };


    return service;
};

'use strict';

exports = module.exports = function(services, app) {

    const gt = app.utility.gettext;
    const service = new services.get(app);

    /**
     * Call the users get service
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        service.app.db.models.User
        .findOne({ '_id' : params.id }, 'email api')
        .exec(function(err, user) {
            if (service.handleMongoError(err))
            {
                if (user && user.api && user.api.clientId) {
                    service.deferred.resolve(user.api);
                } else {
                    service.notFound(gt.gettext('This user does not exists'));
                }
            }
        });

        return service.deferred.promise;
    };


    return service;
};

'use strict';


exports = module.exports = function(services, app) {

    var service = new services.get(app);

    const gt = app.utility.gettext;

    /**
     * Call the AccountCollection get service
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {

        service.app.db.models.AccountCollection
        .findOne({ '_id' : params.id }, 'account rightCollection from to')
        .populate('rightCollection')
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {
                    service.outcome.success = true;
                    service.deferred.resolve(document);
                } else {
                    service.notFound(gt.gettext('This collection does not exists for account'));
                }
            }
        });

        return service.deferred.promise;
    };


    return service;
};

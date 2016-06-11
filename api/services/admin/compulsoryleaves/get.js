'use strict';

const gt = require('./../../../../modules/gettext');



exports = module.exports = function(services, app) {

    var service = new services.get(app);

    /**
     * Call the compulsory leave get service
     *
     * @param {Object} params
     * @return {Promise}
     */
    service.getResultPromise = function(params) {


        service.app.db.models.CompulsoryLeave
        .findOne({ '_id' : params.id})
        .populate('departments')
        .populate('collections')
        .exec(function(err, document) {
            if (service.handleMongoError(err))
            {
                if (document) {
                    service.outcome.success = true;
                    service.deferred.resolve(document);
                } else {
                    service.notFound(gt.gettext('This compulsory leave does not exists'));
                }
            }
        });

        return service.deferred.promise;
    };


    return service;
};


